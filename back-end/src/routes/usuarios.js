const express = require('express');
const router = express.Router();
const { listar, buscarPorId, criar, atualizar, remover } = require('../controllers/usuariosController');
const { autenticar, autorizar } = require('../middlewares/auth');

router.use(autenticar);

router.get('/', autorizar('proprietario', 'gerente'), listar);
router.get('/:id', autorizar('proprietario', 'gerente'), buscarPorId);
router.post('/', autorizar('proprietario'), criar);
router.put('/:id', autorizar('proprietario'), atualizar);
router.delete('/:id', autorizar('proprietario'), remover);

module.exports = router;