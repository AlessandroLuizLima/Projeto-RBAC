'use strict';

const crypto = require('crypto');
const path = require('path');

// Descobre o tipo REAL do arquivo pelos primeiros bytes. O nome e o mimetype
// enviados pelo cliente não são confiáveis (podem ser forjados).
// SVG fica de fora de propósito: pode carregar JavaScript (XSS).
function detectarTipo(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg' };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: 'png' };
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') {
    return { ext: 'webp' };
  }
  return null;
}

function criarImagensController(pool, { dir, urlBase, fs }) {
  // Só apaga arquivos que estão DENTRO da pasta de uploads, mesmo que o banco
  // contenha um valor estranho em imagem_url.
  async function apagarArquivoAntigo(imagemUrl) {
    if (!imagemUrl || !imagemUrl.startsWith(`${urlBase}/`)) return;
    const nome = path.basename(imagemUrl);
    try {
      await fs.unlink(path.join(dir, nome));
    } catch (err) {
      if (err.code !== 'ENOENT') console.error('Falha ao apagar imagem antiga:', err.message);
    }
  }

  function idValido(valor) {
    const id = Number.parseInt(valor, 10);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  // POST /produtos/:id/imagem  (multipart, campo "imagem")
  async function enviar(req, res) {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ erro: 'Produto não encontrado.' });
    if (!req.file) return res.status(400).json({ erro: 'Envie um arquivo no campo "imagem".' });

    const tipo = detectarTipo(req.file.buffer);
    if (!tipo) {
      return res.status(400).json({ erro: 'Formato não suportado. Use JPG, PNG ou WebP.' });
    }

    let nomeArquivo;
    try {
      const atual = await pool.query('SELECT imagem_url FROM produtos WHERE id = $1', [id]);
      if (!atual.rows[0]) return res.status(404).json({ erro: 'Produto não encontrado.' });

      nomeArquivo = `${crypto.randomBytes(16).toString('hex')}.${tipo.ext}`;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, nomeArquivo), req.file.buffer, { flag: 'wx' });

      const novaUrl = `${urlBase}/${nomeArquivo}`;
      await pool.query('UPDATE produtos SET imagem_url = $1 WHERE id = $2', [novaUrl, id]);

      await apagarArquivoAntigo(atual.rows[0].imagem_url);
      return res.json({ id, imagem_url: novaUrl });
    } catch (err) {
      // Não deixa arquivo órfão se algo falhou depois de gravar.
      if (nomeArquivo) {
        try { await fs.unlink(path.join(dir, nomeArquivo)); } catch (_) { /* ignora */ }
      }
      console.error('Erro ao enviar imagem:', err.message);
      return res.status(500).json({ erro: 'Erro ao salvar a imagem.' });
    }
  }

  // DELETE /produtos/:id/imagem
  async function remover(req, res) {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ erro: 'Produto não encontrado.' });

    try {
      const atual = await pool.query('SELECT imagem_url FROM produtos WHERE id = $1', [id]);
      if (!atual.rows[0]) return res.status(404).json({ erro: 'Produto não encontrado.' });

      await pool.query('UPDATE produtos SET imagem_url = NULL WHERE id = $1', [id]);
      await apagarArquivoAntigo(atual.rows[0].imagem_url);
      return res.json({ id, imagem_url: null });
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao remover a imagem.' });
    }
  }

  return { enviar, remover };
}

module.exports = { criarImagensController, detectarTipo };
