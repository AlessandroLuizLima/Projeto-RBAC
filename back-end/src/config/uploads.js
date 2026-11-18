const path = require('path');

// Pasta onde as imagens enviadas ficam gravadas. Em Docker, monte um volume aqui
// (senão as imagens somem quando o container é recriado).
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, '..', '..', 'uploads'));
const PRODUTOS_DIR = path.join(UPLOADS_DIR, 'produtos');

// Prefixo público (servido por express.static em server.js).
const URL_PRODUTOS = '/uploads/produtos';

module.exports = { UPLOADS_DIR, PRODUTOS_DIR, URL_PRODUTOS };
