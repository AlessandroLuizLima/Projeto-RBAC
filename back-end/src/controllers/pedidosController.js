const pool = require('../config/database');

// GET /pedidos - todos veem, mas barista só vê pendentes/em_preparo
async function listar(req, res) {
  try {
    let query = `
      SELECT p.*, u.nome as atendente,
        json_agg(json_build_object(
          'produto_id', ip.produto_id,
          'produto_nome', pr.nome,
          'quantidade', ip.quantidade,
          'preco_unitario', ip.preco_unitario
        )) as itens
      FROM pedidos p
      LEFT JOIN usuarios u ON u.id = p.usuario_id
      LEFT JOIN itens_pedido ip ON ip.pedido_id = p.id
      LEFT JOIN produtos pr ON pr.id = ip.produto_id
    `;

    if (req.usuario.role === 'barista') {
      query += ` WHERE p.status IN ('pendente', 'em_preparo')`;
    }

    query += ` GROUP BY p.id, u.nome ORDER BY p.created_at DESC`;

    const resultado = await pool.query(query);
    return res.json(resultado.rows);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao listar pedidos.' });
  }
}

// GET /pedidos/:id
async function buscarPorId(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT p.*, u.nome as atendente,
        json_agg(json_build_object(
          'produto_id', ip.produto_id,
          'produto_nome', pr.nome,
          'quantidade', ip.quantidade,
          'preco_unitario', ip.preco_unitario
        )) as itens
       FROM pedidos p
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       LEFT JOIN itens_pedido ip ON ip.pedido_id = p.id
       LEFT JOIN produtos pr ON pr.id = ip.produto_id
       WHERE p.id = $1
       GROUP BY p.id, u.nome`,
      [req.params.id]
    );
    if (!resultado.rows[0]) return res.status(404).json({ erro: 'Pedido não encontrado.' });
    return res.json(resultado.rows[0]);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao buscar pedido.' });
  }
}

// POST /pedidos - gerente e barista criam pedidos
async function criar(req, res) {
  const { itens, observacao } = req.body;

  if (!itens || itens.length === 0) {
    return res.status(400).json({ erro: 'O pedido deve ter pelo menos um item.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Cria o pedido
    const pedido = await client.query(
      'INSERT INTO pedidos (usuario_id, observacao) VALUES ($1, $2) RETURNING *',
      [req.usuario.id, observacao]
    );
    const pedidoId = pedido.rows[0].id;

    let total = 0;

    // Insere os itens e desconta estoque
    for (const item of itens) {
      const produto = await client.query(
        'SELECT * FROM produtos WHERE id = $1 AND ativo = true',
        [item.produto_id]
      );

      if (!produto.rows[0]) {
        await client.query('ROLLBACK');
        return res.status(404).json({ erro: `Produto ${item.produto_id} não encontrado.` });
      }

      // Verifica estoque
      const estoque = await client.query(
        'SELECT quantidade FROM estoque WHERE produto_id = $1',
        [item.produto_id]
      );

      if (estoque.rows[0].quantidade < item.quantidade) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          erro: `Estoque insuficiente para ${produto.rows[0].nome}. Disponível: ${estoque.rows[0].quantidade}`
        });
      }

      const precoUnitario = produto.rows[0].preco;
      total += precoUnitario * item.quantidade;

      await client.query(
        'INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)',
        [pedidoId, item.produto_id, item.quantidade, precoUnitario]
      );

      // Desconta estoque
      await client.query(
        'UPDATE estoque SET quantidade = quantidade - $1, updated_at = NOW() WHERE produto_id = $2',
        [item.quantidade, item.produto_id]
      );
    }

    // Atualiza total do pedido
    await client.query('UPDATE pedidos SET total = $1 WHERE id = $2', [total, pedidoId]);

    await client.query('COMMIT');

    const pedidoCriado = await pool.query('SELECT * FROM pedidos WHERE id = $1', [pedidoId]);
    return res.status(201).json(pedidoCriado.rows[0]);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar pedido:', err.message);
    return res.status(500).json({ erro: 'Erro ao criar pedido.' });
  } finally {
    client.release();
  }
}

// PUT /pedidos/:id/status - barista atualiza status
async function atualizarStatus(req, res) {
  const { status } = req.body;
  const statusValidos = ['pendente', 'em_preparo', 'pronto', 'entregue', 'cancelado'];

  if (!statusValidos.includes(status)) {
    return res.status(400).json({ erro: 'Status inválido.' });
  }

  // Barista não pode cancelar
  if (req.usuario.role === 'barista' && status === 'cancelado') {
    return res.status(403).json({ erro: 'Barista não pode cancelar pedidos.' });
  }

  try {
    const resultado = await pool.query(
      'UPDATE pedidos SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!resultado.rows[0]) return res.status(404).json({ erro: 'Pedido não encontrado.' });
    return res.json(resultado.rows[0]);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao atualizar status.' });
  }
}

// DELETE /pedidos/:id - só proprietario e gerente
async function remover(req, res) {
  try {
    const resultado = await pool.query(
      'DELETE FROM pedidos WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (!resultado.rows[0]) return res.status(404).json({ erro: 'Pedido não encontrado.' });
    return res.json({ mensagem: 'Pedido removido com sucesso.' });
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao remover pedido.' });
  }
}

module.exports = { listar, buscarPorId, criar, atualizarStatus, remover };