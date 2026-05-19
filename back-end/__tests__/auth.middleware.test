const jwt = require('jsonwebtoken');

// Importa as funções diretamente sem depender do módulo real
// (evita problemas com pool de banco em testes unitários)
process.env.JWT_SECRET = 'segredo_de_teste';

const { autenticar, autorizar } = require('./mocks/auth.middleware.mock');

// ─────────────────────────────────────────────
// HELPER: cria req/res/next falsos
// ─────────────────────────────────────────────
function mockReqResNext({ headers = {}, usuario = null } = {}) {
  const req = { headers, usuario };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

// ─────────────────────────────────────────────
// autenticar()
// ─────────────────────────────────────────────
describe('Middleware autenticar()', () => {
  test('deve chamar next() com token válido', () => {
    const token = jwt.sign(
      { id: 1, nome: 'Admin', email: 'admin@cafe.com', role: 'proprietario' },
      process.env.JWT_SECRET
    );

    const { req, res, next } = mockReqResNext({
      headers: { authorization: `Bearer ${token}` },
    });

    autenticar(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.usuario).toBeDefined();
    expect(req.usuario.role).toBe('proprietario');
  });

  test('deve retornar 401 se token não for fornecido', () => {
    const { req, res, next } = mockReqResNext({ headers: {} });

    autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ erro: expect.any(String) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('deve retornar 403 se token for inválido', () => {
    const { req, res, next } = mockReqResNext({
      headers: { authorization: 'Bearer token.invalido.aqui' },
    });

    autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('deve retornar 403 se token for assinado com secret errado', () => {
    const token = jwt.sign({ id: 1, role: 'gerente' }, 'secret_errado');
    const { req, res, next } = mockReqResNext({
      headers: { authorization: `Bearer ${token}` },
    });

    autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// autorizar()
// ─────────────────────────────────────────────
describe('Middleware autorizar()', () => {
  test('deve chamar next() se role do usuário estiver na lista permitida', () => {
    const { req, res, next } = mockReqResNext({
      usuario: { id: 1, role: 'gerente' },
    });

    autorizar('proprietario', 'gerente')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('deve retornar 403 se role não tiver permissão', () => {
    const { req, res, next } = mockReqResNext({
      usuario: { id: 2, role: 'barista' },
    });

    autorizar('proprietario', 'gerente')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ erro: expect.any(String) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('barista pode acessar rotas autorizadas para barista', () => {
    const { req, res, next } = mockReqResNext({
      usuario: { id: 3, role: 'barista' },
    });

    autorizar('barista')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('proprietario pode acessar qualquer rota', () => {
    const rolesQueAceitamProprietario = [
      ['proprietario'],
      ['proprietario', 'gerente'],
      ['proprietario', 'gerente', 'barista'],
    ];

    rolesQueAceitamProprietario.forEach((roles) => {
      const { req, res, next } = mockReqResNext({
        usuario: { id: 1, role: 'proprietario' },
      });
      autorizar(...roles)(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});