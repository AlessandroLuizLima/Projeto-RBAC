'use strict';

function makeController(pool) {
  async function listar(req, res) {
    try {
      let query;
      if (req.usuario.role === 'barista') {
        query = "SELECT * FROM pedidos WHERE status IN ('pendente', 'em_preparo')";
      } else {
        query = 'SELECT * FROM pedidos';
      }
      const result = await pool.query(query);
      return res.json(result.rows);
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao listar pedidos' });
    }
  }

  async function buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const result = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ erro: 'Pedido não encontrado' });
      }
      return res.json(result.rows[0]);
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao buscar pedido' });
    }
  }

  async function criar(req, res) {
    const { itens, observacao } = req.body;

    if (!itens || itens.length === 0) {
      return res.status(400).json({ erro: 'Itens são obrigatórios' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const pedidoResult = await client.query(
        'INSERT INTO pedidos (usuario_id, status, observacao) VALUES ($1, $2, $3) RETURNING id',
        [req.usuario.id, 'pendente', observacao || null]
      );
      const pedidoId = pedidoResult.rows[0].id;

      for (const item of itens) {
        const produtoResult = await client.query(
          'SELECT * FROM produtos WHERE id = $1 AND ativo = true',
          [item.produto_id]
        );
        if (produtoResult.rows.length === 0) {
          await client.query('ROLLBACK');
          client.release();
          return res.status(404).json({ erro: 'Produto não encontrado ou inativo' });
        }

        const produto = produtoResult.rows[0];

        const estoqueResult = await client.query(
          'SELECT quantidade FROM estoque WHERE produto_id = $1',
          [item.produto_id]
        );
        const estoqueAtual = estoqueResult.rows[0]?.quantidade || 0;

        if (estoqueAtual < item.quantidade) {
          await client.query('ROLLBACK');
          client.release();
          return res.status(400).json({ erro: `Estoque insuficiente para o produto ${produto.nome}` });
        }

        await client.query(
          'INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)',
          [pedidoId, item.produto_id, item.quantidade, produto.preco]
        );

        await client.query(
          'UPDATE estoque SET quantidade = quantidade - $1 WHERE produto_id = $2',
          [item.quantidade, item.produto_id]
        );
      }

      await client.query('COMMIT');

      const pedidoFinal = await pool.query('SELECT * FROM pedidos WHERE id = $1', [pedidoId]);
      client.release();
      return res.status(201).json(pedidoFinal.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(500).json({ erro: 'Erro ao criar pedido' });
    }
  }

  async function atualizarStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const statusValidos = ['pendente', 'em_preparo', 'pronto', 'entregue', 'cancelado'];
      if (!statusValidos.includes(status)) {
        return res.status(400).json({ erro: 'Status inválido' });
      }

      if (status === 'cancelado' && req.usuario.role !== 'gerente') {
        return res.status(403).json({ erro: 'Apenas gerentes podem cancelar pedidos' });
      }

      const result = await pool.query(
        'UPDATE pedidos SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ erro: 'Pedido não encontrado' });
      }

      return res.json(result.rows[0]);
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao atualizar status' });
    }
  }

  async function remover(req, res) {
    try {
      const { id } = req.params;
      const result = await pool.query('DELETE FROM pedidos WHERE id = $1 RETURNING *', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ erro: 'Pedido não encontrado' });
      }

      return res.json({ mensagem: 'Pedido removido com sucesso' });
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao remover pedido' });
    }
  }

  return { listar, buscarPorId, criar, atualizarStatus, remover };
}

module.exports = { makeController };