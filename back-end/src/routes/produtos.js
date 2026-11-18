const express = require('express');
const router = express.Router();
const { listar, buscarPorId, criar, atualizar, remover } = require('../controllers/produtosController');
const { autenticar, autorizar } = require('../middlewares/auth');
const fs = require('fs').promises;
const pool = require('../config/database');
const { PRODUTOS_DIR, URL_PRODUTOS } = require('../config/uploads');
const { uploadImagem } = require('../middlewares/upload');
const { criarImagensController } = require('../controllers/imagensController');

const imagens = criarImagensController(pool, { dir: PRODUTOS_DIR, urlBase: URL_PRODUTOS, fs });

router.use(autenticar);

router.get('/', listar);
router.get('/:id', buscarPorId);
router.post('/', autorizar('proprietario', 'gerente'), criar);
router.put('/:id', autorizar('proprietario', 'gerente'), atualizar);
router.delete('/:id', autorizar('proprietario'), remover);

// Imagem do produto (upload de arquivo pelo painel)
router.post('/:id/imagem', autorizar('proprietario', 'gerente'), uploadImagem, imagens.enviar);
router.delete('/:id/imagem', autorizar('proprietario', 'gerente'), imagens.remover);

module.exports = router;