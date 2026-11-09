const express = require('express');
const rateLimit = require('express-rate-limit');
const pool = require('../config/database');
const { criarValidarMesa } = require('../middlewares/mesa');
const { criarPublicoController } = require('../controllers/publicoController');

const router = express.Router();
const validarMesa = criarValidarMesa(pool);
const publico = criarPublicoController(pool);

const mensagemLimite = { erro: 'Muitas requisições. Tente novamente em instantes.' };

// Proteção geral contra flood, por IP.
// Atenção: numa cafeteria todos os clientes saem pelo MESMO IP (o Wi-Fi do local),
// então este limite é propositalmente folgado e configurável.
const limiteGeral = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.PUBLICO_LIMITE_IP_POR_MIN) || 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: mensagemLimite,
});

// Limite de pedidos por MESA (e não por IP): uma mesa não faz 10+ pedidos em 10 min.
const limitePedidosPorMesa = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: Number(process.env.PUBLICO_LIMITE_PEDIDOS_MESA) || 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => `mesa-${req.mesa.id}`,
  message: mensagemLimite,
});

router.use(limiteGeral);

router.get('/mesa/:numero/cardapio', validarMesa, publico.cardapio);
// validarMesa vem antes do limitador, que usa req.mesa.id como chave.
router.post('/mesa/:numero/pedidos', validarMesa, limitePedidosPorMesa, publico.criarPedido);
router.get('/mesa/:numero/pedidos/:id', validarMesa, publico.statusPedido);

module.exports = router;
