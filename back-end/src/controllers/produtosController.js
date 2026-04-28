const pool = require('../config/database');

// GET /produtos - todos
async function listar(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT p.*, e.quantidade as estoque
       FROM produtos p
       LEFT JOIN estoque e ON e.produto_id = p.id
       WHERE p.ativo = true
       ORDER BY p.categoria, p.nome`
    );
    return res.json(resultado.rows);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao listar produtos.' });
  }
}

// GET /produtos/:id
async function buscarPorId(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT p.*, e.quantidade as estoque
       FROM produtos p
       LEFT JOIN estoque e ON e.produto_id = p.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (!resultado.rows[0]) return res.status(404).json({ erro: 'Produto não encontrado.' });
    return res.json(resultado.rows[0]);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao buscar produto.' });
  }
}

// POST /produtos - proprietario e gerente
async function criar(req, res) {
  const { nome, descricao, preco, categoria } = req.body;

  if (!nome || !preco || !categoria) {
    return res.status(400).json({ erro: 'Nome, preço e categoria são obrigatórios.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const produto = await client.query(
      'INSERT INTO produtos (nome, descricao, preco, categoria) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, descricao, preco, categoria]
    );

    await client.query(
      'INSERT INTO estoque (produto_id, quantidade, quantidade_minima) VALUES ($1, 0, 5)',
      [produto.rows[0].id]
    );

    await client.query('COMMIT');
    return res.status(201).json(produto.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    return res.status(500).json({ erro: 'Erro ao criar produto.' });
  } finally {
    client.release();
  }
}

// PUT /produtos/:id - proprietario e gerente
async function atualizar(req, res) {
  const { nome, descricao, preco, categoria, ativo } = req.body;

  try {
    const resultado = await pool.query(
      `UPDATE produtos SET
        nome = COALESCE($1, nome),
        descricao = COALESCE($2, descricao),
        preco = COALESCE($3, preco),
        categoria = COALESCE($4, categoria),
        ativo = COALESCE($5, ativo)
       WHERE id = $6
       RETURNING *`,
      [nome, descricao, preco, categoria, ativo, req.params.id]
    );
    if (!resultado.rows[0]) return res.status(404).json({ erro: 'Produto não encontrado.' });
    return res.json(resultado.rows[0]);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao atualizar produto.' });
  }
}

// DELETE /produtos/:id - só proprietario
async function remover(req, res) {
  try {
    const resultado = await pool.query(
      'DELETE FROM produtos WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (!resultado.rows[0]) return res.status(404).json({ erro: 'Produto não encontrado.' });
    return res.json({ mensagem: 'Produto removido com sucesso.' });
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao remover produto.' });
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };