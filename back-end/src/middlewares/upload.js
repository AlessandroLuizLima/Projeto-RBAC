const multer = require('multer');

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

// O arquivo fica em memória só até o controller validar o conteúdo real
// (assinatura/magic bytes) e gravá-lo com nome aleatório.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1, fields: 5 },
}).single('imagem');

function uploadImagem(req, res, next) {
  upload(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ erro: 'Imagem muito grande. O limite é 2 MB.' });
    }
    return res.status(400).json({ erro: 'Upload inválido. Envie um arquivo no campo "imagem".' });
  });
}

module.exports = { uploadImagem, MAX_BYTES };
