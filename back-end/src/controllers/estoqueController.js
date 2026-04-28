const pool = require('../config/database');

// GET /estoque - proprietario e gerente
async function listar(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT e.*, p.nome as produto_nome, p.categoria
       FROM estoque e
       JOIN produtos p ON p.id = e.produto_id
       ORDER BY p.nome`
    );
    return res.json(resultado.rows);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao listar estoque.' });
  }
}

// GET /estoque/baixo - itens abaixo do mínimo
async function listarBaixo(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT e.*, p.nome as produto_nome, p.categoria
       FROM estoque e
       JOIN produtos p ON p.id = e.produto_id
       WHERE e.quantidade <= e.quantidade_minima
       ORDER BY e.quantidade ASC`
    );
    return res.json(resultado.rows);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao listar estoque baixo.' });
  }
}

// PUT /estoque/:produto_id - proprietario e gerente
async function atualizar(req, res) {
  const { quantidade, quantidade_minima } = req.body;

  if (quantidade === undefined) {
    return res.status(400).json({ erro: 'Quantidade é obrigatória.' });
  }

  try {
    const resultado = await pool.query(
      `UPDATE estoque SET
        quantidade = $1,
        quantidade_minima = COALESCE($2, quantidade_minima),
        updated_at = NOW()
       WHERE produto_id = $3
       RETURNING *`,
      [quantidade, quantidade_minima, req.params.produto_id]
    );
    if (!resultado.rows[0]) return res.status(404).json({ erro: 'Estoque não encontrado.' });
    return res.json(resultado.rows[0]);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao atualizar estoque.' });
  }
}

module.exports = { listar, listarBaixo, atualizar };