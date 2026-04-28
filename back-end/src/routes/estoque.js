const express = require('express');
const router = express.Router();
const { listar, listarBaixo, atualizar } = require('../controllers/estoqueController');
const { autenticar, autorizar } = require('../middlewares/auth');

router.use(autenticar);

router.get('/', autorizar('proprietario', 'gerente'), listar);
router.get('/baixo', autorizar('proprietario', 'gerente'), listarBaixo);
router.put('/:produto_id', autorizar('proprietario', 'gerente'), atualizar);

module.exports = router;