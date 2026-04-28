const express = require('express');
const router = express.Router();
const { listar, buscarPorId, criar, atualizar, remover } = require('../controllers/produtosController');
const { autenticar, autorizar } = require('../middlewares/auth');

router.use(autenticar);

router.get('/', listar);
router.get('/:id', buscarPorId);
router.post('/', autorizar('proprietario', 'gerente'), criar);
router.put('/:id', autorizar('proprietario', 'gerente'), atualizar);
router.delete('/:id', autorizar('proprietario'), remover);

module.exports = router;