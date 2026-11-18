// Testa o controller REAL (src/controllers/imagensController.js).
const path = require('path');
const { criarImagensController, detectarTipo } = require('../src/controllers/imagensController');

const DIR = '/srv/uploads/produtos';
const URL_BASE = '/uploads/produtos';

const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(20, 1)]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(20, 1)]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(10)]);
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
const EXE = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(40)]);

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
}

function setup({ imagemAtual = null, produtoExiste = true, falharEm } = {}) {
  const fs = {
    mkdir: jest.fn().mockResolvedValue(),
    writeFile: jest.fn().mockResolvedValue(),
    unlink: jest.fn().mockResolvedValue(),
  };
  const pool = {
    query: jest.fn(async (sql) => {
      if (falharEm && falharEm.test(sql)) throw new Error('DB');
      if (/^SELECT imagem_url/.test(sql)) return { rows: produtoExiste ? [{ imagem_url: imagemAtual }] : [] };
      return { rows: [] };
    }),
  };
  return { fs, pool, ctrl: criarImagensController(pool, { dir: DIR, urlBase: URL_BASE, fs }) };
}

describe('detectarTipo()', () => {
  test.each([
    ['JPEG', JPG, 'jpg'],
    ['PNG', PNG, 'png'],
    ['WebP', WEBP, 'webp'],
  ])('reconhece %s pelos bytes', (_n, buf, ext) => expect(detectarTipo(buf)).toEqual({ ext }));

  test.each([
    ['SVG (pode ter script)', SVG],
    ['executável', EXE],
    ['arquivo vazio', Buffer.alloc(0)],
    ['arquivo pequeno demais', Buffer.from([0xff, 0xd8, 0xff])],
    ['não-buffer', 'texto'],
    ['RIFF que não é WebP (ex.: WAV)', Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVE'), Buffer.alloc(10)])],
  ])('rejeita %s', (_n, buf) => expect(detectarTipo(buf)).toBeNull());
});

describe('imagensController.enviar()', () => {
  test('sucesso: grava com nome aleatório, atualiza o banco e responde a URL pública', async () => {
    const { ctrl, fs, pool } = setup();
    const res = mockRes();
    await ctrl.enviar({ params: { id: '4' }, file: { buffer: PNG, originalname: 'foto.png' } }, res);

    const [caminho, conteudo, opts] = fs.writeFile.mock.calls[0];
    expect(path.dirname(caminho)).toBe(DIR);
    expect(path.basename(caminho)).toMatch(/^[0-9a-f]{32}\.png$/);
    expect(conteudo).toBe(PNG);
    expect(opts).toEqual({ flag: 'wx' }); // nunca sobrescreve arquivo existente

    const update = pool.query.mock.calls.find((c) => /^UPDATE produtos/.test(c[0]));
    expect(update[1]).toEqual([`${URL_BASE}/${path.basename(caminho)}`, 4]);
    expect(res.json).toHaveBeenCalledWith({ id: 4, imagem_url: `${URL_BASE}/${path.basename(caminho)}` });
  });

  test('a extensão vem do conteúdo, NÃO do nome enviado (arquivo .php com PNG dentro vira .png)', async () => {
    const { ctrl, fs } = setup();
    await ctrl.enviar({ params: { id: '1' }, file: { buffer: PNG, originalname: 'shell.php' } }, mockRes());
    expect(path.basename(fs.writeFile.mock.calls[0][0])).toMatch(/\.png$/);
  });

  test('conteúdo falso com nome .jpg (na verdade SVG/EXE) → 400 e nada gravado', async () => {
    for (const buffer of [SVG, EXE]) {
      const { ctrl, fs, pool } = setup();
      const res = mockRes();
      await ctrl.enviar({ params: { id: '1' }, file: { buffer, originalname: 'foto.jpg', mimetype: 'image/jpeg' } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(fs.writeFile).not.toHaveBeenCalled();
      expect(pool.query).not.toHaveBeenCalled();
    }
  });

  test('nomes aleatórios: dois envios nunca geram o mesmo arquivo', async () => {
    const { ctrl, fs } = setup();
    for (let i = 0; i < 20; i++) await ctrl.enviar({ params: { id: '1' }, file: { buffer: JPG } }, mockRes());
    const nomes = new Set(fs.writeFile.mock.calls.map((c) => path.basename(c[0])));
    expect(nomes.size).toBe(20);
  });

  test('sem arquivo → 400', async () => {
    const { ctrl } = setup();
    const res = mockRes();
    await ctrl.enviar({ params: { id: '1' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test.each(['abc', '0', '-3'])('id inválido (%p) → 404', async (id) => {
    const { ctrl, fs } = setup();
    const res = mockRes();
    await ctrl.enviar({ params: { id }, file: { buffer: JPG } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  test('produto inexistente → 404 e NADA gravado em disco', async () => {
    const { ctrl, fs } = setup({ produtoExiste: false });
    const res = mockRes();
    await ctrl.enviar({ params: { id: '99' }, file: { buffer: JPG } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  test('troca de imagem: apaga o arquivo antigo (só o nome, dentro da pasta de uploads)', async () => {
    const { ctrl, fs } = setup({ imagemAtual: `${URL_BASE}/antiga.jpg` });
    await ctrl.enviar({ params: { id: '1' }, file: { buffer: JPG } }, mockRes());
    expect(fs.unlink).toHaveBeenCalledWith(path.join(DIR, 'antiga.jpg'));
  });

  test('SEGURANÇA: imagem_url com path traversal não apaga nada fora da pasta', async () => {
    const { ctrl, fs } = setup({ imagemAtual: `${URL_BASE}/../../../etc/passwd` });
    await ctrl.enviar({ params: { id: '1' }, file: { buffer: JPG } }, mockRes());
    expect(fs.unlink).toHaveBeenCalledWith(path.join(DIR, 'passwd')); // basename: fica DENTRO de DIR
    expect(fs.unlink.mock.calls.every((c) => c[0].startsWith(DIR + path.sep))).toBe(true);
  });

  test('imagem_url externa/antiga (http...) não tenta apagar arquivo local', async () => {
    const { ctrl, fs } = setup({ imagemAtual: 'https://exemplo.com/x.jpg' });
    await ctrl.enviar({ params: { id: '1' }, file: { buffer: JPG } }, mockRes());
    expect(fs.unlink).not.toHaveBeenCalled();
  });

  test('arquivo antigo já inexistente (ENOENT) não derruba o envio', async () => {
    const { ctrl, fs } = setup({ imagemAtual: `${URL_BASE}/sumiu.jpg` });
    fs.unlink.mockRejectedValue(Object.assign(new Error('x'), { code: 'ENOENT' }));
    const res = mockRes();
    await ctrl.enviar({ params: { id: '1' }, file: { buffer: JPG } }, res);
    expect(res.status).not.toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalled();
  });

  test('falha ao apagar o antigo por outro motivo é só registrada (o envio já deu certo)', async () => {
    const { ctrl, fs } = setup({ imagemAtual: `${URL_BASE}/a.jpg` });
    fs.unlink.mockRejectedValue(Object.assign(new Error('EPERM'), { code: 'EPERM' }));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = mockRes();
    await ctrl.enviar({ params: { id: '1' }, file: { buffer: JPG } }, res);
    expect(res.status).not.toHaveBeenCalledWith(500);
    expect(console.error).toHaveBeenCalled();
    console.error.mockRestore();
  });

  test('falha no UPDATE do banco → 500 e o arquivo recém-gravado é removido (sem órfão)', async () => {
    const { ctrl, fs } = setup({ falharEm: /^UPDATE produtos/ });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = mockRes();
    await ctrl.enviar({ params: { id: '1' }, file: { buffer: JPG } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    const gravado = fs.writeFile.mock.calls[0][0];
    expect(fs.unlink).toHaveBeenCalledWith(gravado);
    console.error.mockRestore();
  });

  test('falha ao gravar em disco → 500 sem tocar no banco', async () => {
    const { ctrl, fs, pool } = setup();
    fs.writeFile.mockRejectedValue(new Error('disco cheio'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = mockRes();
    await ctrl.enviar({ params: { id: '1' }, file: { buffer: JPG } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(pool.query.mock.calls.some((c) => /^UPDATE/.test(c[0]))).toBe(false);
    console.error.mockRestore();
  });
});

describe('imagensController.remover()', () => {
  test('zera a imagem no banco e apaga o arquivo', async () => {
    const { ctrl, fs, pool } = setup({ imagemAtual: `${URL_BASE}/x.webp` });
    const res = mockRes();
    await ctrl.remover({ params: { id: '2' } }, res);
    expect(pool.query.mock.calls.find((c) => /SET imagem_url = NULL/.test(c[0]))[1]).toEqual([2]);
    expect(fs.unlink).toHaveBeenCalledWith(path.join(DIR, 'x.webp'));
    expect(res.json).toHaveBeenCalledWith({ id: 2, imagem_url: null });
  });

  test('produto sem imagem: ok, sem apagar nada', async () => {
    const { ctrl, fs } = setup({ imagemAtual: null });
    const res = mockRes();
    await ctrl.remover({ params: { id: '2' } }, res);
    expect(fs.unlink).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ id: 2, imagem_url: null });
  });

  test('produto inexistente → 404', async () => {
    const { ctrl } = setup({ produtoExiste: false });
    const res = mockRes();
    await ctrl.remover({ params: { id: '2' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('id inválido → 404', async () => {
    const { ctrl } = setup();
    const res = mockRes();
    await ctrl.remover({ params: { id: 'x' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('erro de banco → 500', async () => {
    const { ctrl } = setup({ falharEm: /^SELECT/ });
    const res = mockRes();
    await ctrl.remover({ params: { id: '2' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
