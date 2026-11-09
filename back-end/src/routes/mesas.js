const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { criarMesasController } = require('../controllers/mesasController');
const { autenticar, autorizar } = require('../middlewares/auth');

const mesas = criarMesasController(pool);

router.use(autenticar);

router.get('/', autorizar('proprietario', 'gerente'), mesas.listar);
router.post('/', autorizar('proprietario'), mesas.criar);

module.exports = router;
