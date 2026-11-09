'use strict';

const crypto = require('crypto');

// Gestão das mesas (área interna, com login).
function criarMesasController(pool) {
  // GET /mesas - proprietario e gerente (o token é usado para gerar o QR code)
  async function listar(req, res) {
    try {
      const resultado = await pool.query(
        'SELECT id, numero, token, ativa FROM mesas ORDER BY numero'
      );
      return res.json(resultado.rows);
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao listar mesas.' });
    }
  }

  // POST /mesas - só proprietario
  async function criar(req, res) {
    const numero = req.body && req.body.numero;
    if (!Number.isInteger(numero) || numero <= 0) {
      return res.status(400).json({ erro: 'Número da mesa deve ser um inteiro positivo.' });
    }

    try {
      const token = crypto.randomBytes(16).toString('hex');
      const resultado = await pool.query(
        'INSERT INTO mesas (numero, token) VALUES ($1, $2) RETURNING id, numero, token, ativa',
        [numero, token]
      );
      return res.status(201).json(resultado.rows[0]);
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ erro: `A mesa ${numero} já existe.` });
      }
      return res.status(500).json({ erro: 'Erro ao criar mesa.' });
    }
  }

  return { listar, criar };
}

module.exports = { criarMesasController };
