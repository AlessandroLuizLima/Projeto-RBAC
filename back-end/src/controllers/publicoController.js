'use strict';

// Rotas públicas: usadas pelo cliente na mesa, SEM login.
// A identificação vem do token da mesa (ver middlewares/mesa.js).

const LIMITES = Object.freeze({
  maxItensDistintos: 20,
  maxQuantidadePorItem: 10,
  maxObservacao: 200,
});

// Valida os itens e junta duplicados (mesmo produto 2x vira 1 linha com a soma).
// Devolve ordenado por produto_id: a ordem fixa evita deadlock entre pedidos
// simultâneos que travam as mesmas linhas de estoque.
function normalizarItens(itens) {
  if (!Array.isArray(itens) || itens.length === 0) {
    return { erro: 'O pedido deve ter pelo menos um item.' };
  }
  if (itens.length > LIMITES.maxItensDistintos) {
    return { erro: `O pedido pode ter no máximo ${LIMITES.maxItensDistintos} itens diferentes.` };
  }

  const agrupados = new Map();
  for (const item of itens) {
    const produtoId = item && item.produto_id;
    const quantidade = item && item.quantidade;

    if (!Number.isInteger(produtoId) || produtoId <= 0) {
      return { erro: 'Item com produto inválido.' };
    }
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      return { erro: 'Item com quantidade inválida.' };
    }
    agrupados.set(produtoId, (agrupados.get(produtoId) || 0) + quantidade);
  }

  for (const quantidade of agrupados.values()) {
    if (quantidade > LIMITES.maxQuantidadePorItem) {
      return { erro: `Quantidade máxima por item: ${LIMITES.maxQuantidadePorItem}.` };
    }
  }

  const lista = [...agrupados.entries()]
    .map(([produto_id, quantidade]) => ({ produto_id, quantidade }))
    .sort((a, b) => a.produto_id - b.produto_id);

  return { itens: lista };
}

function normalizarObservacao(observacao) {
  if (observacao === undefined || observacao === null) return { observacao: null };
  if (typeof observacao !== 'string') return { erro: 'Observação inválida.' };

  const texto = observacao.trim();
  if (texto.length > LIMITES.maxObservacao) {
    return { erro: `A observação pode ter no máximo ${LIMITES.maxObservacao} caracteres.` };
  }
  return { observacao: texto === '' ? null : texto };
}

async function rollbackSeguro(client) {
  try {
    await client.query('ROLLBACK');
  } catch (_) {
    // Se o rollback falhar, o erro original é mais importante.
  }
}

function criarPublicoController(pool) {
  // GET /publico/mesa/:numero/cardapio
  async function cardapio(req, res) {
    try {
      const resultado = await pool.query(
        `SELECT p.id, p.nome, p.descricao, p.preco, p.categoria, p.imagem_url,
                COALESCE(e.quantidade, 0) > 0 AS disponivel
         FROM produtos p
         LEFT JOIN estoque e ON e.produto_id = p.id
         WHERE p.ativo = true
         ORDER BY p.categoria, p.nome`
      );
      return res.json({ mesa: req.mesa.numero, produtos: resultado.rows });
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao carregar o cardápio.' });
    }
  }

  // POST /publico/mesa/:numero/pedidos
  // Body: { itens: [{ produto_id, quantidade }], observacao? }
  // O preço NUNCA vem do cliente: é sempre lido do banco.
  async function criarPedido(req, res) {
    const body = req.body || {};

    const validacaoItens = normalizarItens(body.itens);
    if (validacaoItens.erro) return res.status(400).json({ erro: validacaoItens.erro });

    const validacaoObs = normalizarObservacao(body.observacao);
    if (validacaoObs.erro) return res.status(400).json({ erro: validacaoObs.erro });

    const { itens } = validacaoItens;
    const { observacao } = validacaoObs;

    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');

      // 1) Valida tudo e trava o estoque (FOR UPDATE) antes de gravar qualquer coisa.
      const linhas = [];
      let totalCentavos = 0;

      for (const item of itens) {
        const produto = await client.query(
          'SELECT id, nome, preco FROM produtos WHERE id = $1 AND ativo = true',
          [item.produto_id]
        );
        if (!produto.rows[0]) {
          await rollbackSeguro(client);
          return res.status(400).json({ erro: `Produto ${item.produto_id} indisponível.` });
        }

        const estoque = await client.query(
          'SELECT quantidade FROM estoque WHERE produto_id = $1 FOR UPDATE',
          [item.produto_id]
        );
        const disponivel = estoque.rows[0] ? estoque.rows[0].quantidade : 0;
        if (disponivel < item.quantidade) {
          await rollbackSeguro(client);
          return res.status(409).json({
            erro: `${produto.rows[0].nome} está indisponível ou sem estoque suficiente.`,
          });
        }

        const precoUnitario = produto.rows[0].preco;
        totalCentavos += Math.round(Number(precoUnitario) * 100) * item.quantidade;
        linhas.push({ produto_id: item.produto_id, quantidade: item.quantidade, precoUnitario });
      }

      const total = totalCentavos / 100;

      // 2) Grava o pedido, os itens e desconta o estoque.
      const pedido = await client.query(
        `INSERT INTO pedidos (mesa_id, origem, observacao, total)
         VALUES ($1, 'mesa', $2, $3)
         RETURNING id, status, total, created_at`,
        [req.mesa.id, observacao, total]
      );
      const pedidoId = pedido.rows[0].id;

      for (const linha of linhas) {
        await client.query(
          `INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario)
           VALUES ($1, $2, $3, $4)`,
          [pedidoId, linha.produto_id, linha.quantidade, linha.precoUnitario]
        );
        await client.query(
          'UPDATE estoque SET quantidade = quantidade - $1, updated_at = NOW() WHERE produto_id = $2',
          [linha.quantidade, linha.produto_id]
        );
      }

      await client.query('COMMIT');

      return res.status(201).json({
        id: pedidoId,
        mesa: req.mesa.numero,
        status: pedido.rows[0].status,
        total,
      });
    } catch (err) {
      if (client) await rollbackSeguro(client);
      console.error('Erro ao criar pedido público:', err.message);
      return res.status(500).json({ erro: 'Erro ao criar pedido.' });
    } finally {
      if (client) client.release();
    }
  }

  // GET /publico/mesa/:numero/pedidos/:id
  // O cliente só enxerga pedidos DA PRÓPRIA MESA (filtro por mesa_id).
  async function statusPedido(req, res) {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(404).json({ erro: 'Pedido não encontrado.' });
    }

    try {
      const resultado = await pool.query(
        `SELECT p.id, p.status, p.total, p.observacao, p.created_at, p.updated_at,
                COALESCE(
                  json_agg(json_build_object(
                    'produto_nome', pr.nome,
                    'quantidade', ip.quantidade,
                    'preco_unitario', ip.preco_unitario
                  )) FILTER (WHERE ip.id IS NOT NULL),
                  '[]'::json
                ) AS itens
         FROM pedidos p
         LEFT JOIN itens_pedido ip ON ip.pedido_id = p.id
         LEFT JOIN produtos pr ON pr.id = ip.produto_id
         WHERE p.id = $1 AND p.mesa_id = $2
         GROUP BY p.id`,
        [id, req.mesa.id]
      );
      if (!resultado.rows[0]) return res.status(404).json({ erro: 'Pedido não encontrado.' });
      return res.json(resultado.rows[0]);
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao buscar pedido.' });
    }
  }

  return { cardapio, criarPedido, statusPedido };
}

module.exports = { criarPublicoController, normalizarItens, normalizarObservacao, LIMITES };
