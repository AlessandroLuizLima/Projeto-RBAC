const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'segredo_de_teste';

const { makeController } = require('./mocks/authController.mock');

function makePool(queryFn) {
  return { query: queryFn };
}

function mockReqRes(body = {}, usuario = null) {
  const req = { body, usuario };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return { req, res };
}

describe('authController.login()', () => {
  test('deve retornar 400 se email ou senha não forem enviados', async () => {
    const pool = makePool(jest.fn());
    const { login } = makeController(pool);
    const { req, res } = mockReqRes({ email: '', senha: '' });
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('deve retornar 401 se usuário não existir no banco', async () => {
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [] }));
    const { login } = makeController(pool);
    const { req, res } = mockReqRes({ email: 'naoexiste@cafe.com', senha: '123456' });
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('deve retornar 401 se senha estiver errada', async () => {
    const senhaHash = await bcrypt.hash('senha_correta', 10);
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [{ id: 1, nome: 'Ana', email: 'ana@cafe.com', senha: senhaHash, role: 'gerente' }] }));
    const { login } = makeController(pool);
    const { req, res } = mockReqRes({ email: 'ana@cafe.com', senha: 'senha_errada' });
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('deve retornar token e dados do usuário com credenciais corretas', async () => {
    const senhaHash = await bcrypt.hash('senha123', 10);
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [{ id: 1, nome: 'Ana', email: 'ana@cafe.com', senha: senhaHash, role: 'gerente' }] }));
    const { login } = makeController(pool);
    const { req, res } = mockReqRes({ email: 'ana@cafe.com', senha: 'senha123' });
    await login(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      token: expect.any(String),
      usuario: expect.objectContaining({ email: 'ana@cafe.com', role: 'gerente' }),
    }));
  });

  test('o token deve conter os dados corretos do usuário', async () => {
    const senhaHash = await bcrypt.hash('senha123', 10);
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [{ id: 5, nome: 'Carlos', email: 'carlos@cafe.com', senha: senhaHash, role: 'proprietario' }] }));
    const { login } = makeController(pool);
    const { req, res } = mockReqRes({ email: 'carlos@cafe.com', senha: 'senha123' });
    await login(req, res);
    const chamada = res.json.mock.calls[0][0];
    const decoded = jwt.verify(chamada.token, process.env.JWT_SECRET);
    expect(decoded.id).toBe(5);
    expect(decoded.role).toBe('proprietario');
  });

  test('deve retornar 500 se o banco lançar erro', async () => {
    const pool = makePool(jest.fn().mockRejectedValue(new Error('DB fail')));
    const { login } = makeController(pool);
    const { req, res } = mockReqRes({ email: 'a@cafe.com', senha: '123' });
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('authController.perfil()', () => {
  test('deve retornar os dados do usuário autenticado', async () => {
    const usuarioFake = { id: 1, nome: 'Ana', email: 'ana@cafe.com', role: 'gerente', created_at: new Date() };
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [usuarioFake] }));
    const { perfil } = makeController(pool);
    const { req, res } = mockReqRes({}, { id: 1 });
    await perfil(req, res);
    expect(res.json).toHaveBeenCalledWith(usuarioFake);
  });

  test('deve retornar 500 se o banco falhar', async () => {
    const pool = makePool(jest.fn().mockRejectedValue(new Error('Falha')));
    const { perfil } = makeController(pool);
    const { req, res } = mockReqRes({}, { id: 1 });
    await perfil(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});