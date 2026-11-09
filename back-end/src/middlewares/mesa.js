'use strict';

const crypto = require('crypto');

// Comparação em tempo constante, para não vazar o token por diferença de tempo.
function tokensIguais(esperado, recebido) {
  const a = Buffer.from(String(esperado));
  const b = Buffer.from(String(recebido));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Valida a mesa das rotas públicas (/api/publico/mesa/:numero/...).
 * O token vem no header `x-mesa-token` (ou na query `?t=`), e é o mesmo que
 * está dentro do QR code da mesa.
 *
 * Mesa inexistente, inativa ou token errado respondem a MESMA mensagem, para
 * não revelar quais mesas existem.
 */
function criarValidarMesa(pool) {
  return async function validarMesa(req, res, next) {
    const numero = Number.parseInt(req.params.numero, 10);
    const token = req.get('x-mesa-token') || req.query.t;

    if (!Number.isInteger(numero) || numero <= 0 || !token) {
      return res.status(401).json({ erro: 'Acesso à mesa não autorizado.' });
    }

    try {
      const resultado = await pool.query(
        'SELECT id, numero, token FROM mesas WHERE numero = $1 AND ativa = true',
        [numero]
      );
      const mesa = resultado.rows[0];

      if (!mesa || !tokensIguais(mesa.token, token)) {
        return res.status(401).json({ erro: 'Acesso à mesa não autorizado.' });
      }

      req.mesa = { id: mesa.id, numero: mesa.numero };
      return next();
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao validar a mesa.' });
    }
  };
}

module.exports = { criarValidarMesa, tokensIguais };
