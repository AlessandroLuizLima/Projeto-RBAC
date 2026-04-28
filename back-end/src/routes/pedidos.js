const express = require('express');
const router = express.Router();
const { listar, buscarPorId, criar, atualizarStatus, remover } = require('../controllers/pedidosController');
const { autenticar, autorizar } = require('../middlewares/auth');

router.use(autenticar);

router.get('/', listar);
router.get('/:id', buscarPorId);
router.post('/', autorizar('proprietario', 'gerente', 'barista'), criar);
router.put('/:id/status', autorizar('proprietario', 'gerente', 'barista'), atualizarStatus);
router.delete('/:id', autorizar('proprietario', 'gerente'), remover);

module.exports = router;