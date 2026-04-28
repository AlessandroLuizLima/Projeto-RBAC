const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// GET /usuarios - proprietario e gerente
async function listar(req, res) {
  try {
    const resultado = await pool.query(
      'SELECT id, nome, email, role, ativo, created_at FROM usuarios ORDER BY id'
    );
    return res.json(resultado.rows);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao listar usuários.' });
  }
}

// GET /usuarios/:id
async function buscarPorId(req, res) {
  try {
    const resultado = await pool.query(
      'SELECT id, nome, email, role, ativo, created_at FROM usuarios WHERE id = $1',
      [req.params.id]
    );
    if (!resultado.rows[0]) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    return res.json(resultado.rows[0]);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao buscar usuário.' });
  }
}

// POST /usuarios - só proprietario
async function criar(req, res) {
  const { nome, email, senha, role } = req.body;

  if (!nome || !email || !senha || !role) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }

  const rolesValidas = ['proprietario', 'gerente', 'barista'];
  if (!rolesValidas.includes(role)) {
    return res.status(400).json({ erro: 'Role inválida. Use: proprietario, gerente ou barista.' });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    const resultado = await pool.query(
      'INSERT INTO usuarios (nome, email, senha, role) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, role, ativo, created_at',
      [nome, email, senhaHash, role]
    );
    return res.status(201).json(resultado.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ erro: 'Email já cadastrado.' });
    return res.status(500).json({ erro: 'Erro ao criar usuário.' });
  }
}

// PUT /usuarios/:id - só proprietario
async function atualizar(req, res) {
  const { nome, email, role, ativo } = req.body;

  try {
    const resultado = await pool.query(
      `UPDATE usuarios SET
        nome = COALESCE($1, nome),
        email = COALESCE($2, email),
        role = COALESCE($3, role),
        ativo = COALESCE($4, ativo)
       WHERE id = $5
       RETURNING id, nome, email, role, ativo`,
      [nome, email, role, ativo, req.params.id]
    );
    if (!resultado.rows[0]) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    return res.json(resultado.rows[0]);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao atualizar usuário.' });
  }
}

// DELETE /usuarios/:id - só proprietario
async function remover(req, res) {
  try {
    const resultado = await pool.query(
      'DELETE FROM usuarios WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (!resultado.rows[0]) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    return res.json({ mensagem: 'Usuário removido com sucesso.' });
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao remover usuário.' });
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };