// Testa o controller REAL (src/controllers/mesasController.js).
const { criarMesasController } = require('../src/controllers/mesasController');

function setup(queryFn, body = {}) {
  const pool = { query: queryFn };
  const req = { body };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return { ctrl: criarMesasController(pool), req, res, pool };
}

describe('mesasController.listar()', () => {
  test('retorna as mesas', async () => {
    const rows = [{ id: 1, numero: 1, token: 'x', ativa: true }];
    const { ctrl, req, res } = setup(jest.fn().mockResolvedValue({ rows }));
    await ctrl.listar(req, res);
    expect(res.json).toHaveBeenCalledWith(rows);
  });

  test('erro → 500', async () => {
    const { ctrl, req, res } = setup(jest.fn().mockRejectedValue(new Error('DB')));
    await ctrl.listar(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('mesasController.criar()', () => {
  test('cria mesa com token aleatório de 32 hex', async () => {
    const query = jest.fn().mockImplementation(async (_sql, [numero, token]) => ({
      rows: [{ id: 9, numero, token, ativa: true }],
    }));
    const { ctrl, req, res } = setup(query, { numero: 12 });
    await ctrl.criar(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    const criada = res.json.mock.calls[0][0];
    expect(criada.numero).toBe(12);
    expect(criada.token).toMatch(/^[0-9a-f]{32}$/);
  });

  test('tokens de mesas diferentes não se repetem', async () => {
    const tokens = new Set();
    const query = jest.fn().mockImplementation(async (_sql, [numero, token]) => {
      tokens.add(token);
      return { rows: [{ id: 1, numero, token, ativa: true }] };
    });
    for (let n = 1; n <= 20; n++) {
      const { ctrl, req, res } = setup(query, { numero: n });
      await ctrl.criar(req, res);
    }
    expect(tokens.size).toBe(20);
  });

  test.each([undefined, 0, -1, 1.5, '3', null])('número inválido (%p) → 400', async (numero) => {
    const query = jest.fn();
    const { ctrl, req, res } = setup(query, { numero });
    await ctrl.criar(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(query).not.toHaveBeenCalled();
  });

  test('sem body → 400', async () => {
    const { ctrl, res } = setup(jest.fn());
    await ctrl.criar({}, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('mesa duplicada (23505) → 409', async () => {
    const erro = Object.assign(new Error('dup'), { code: '23505' });
    const { ctrl, req, res } = setup(jest.fn().mockRejectedValue(erro), { numero: 3 });
    await ctrl.criar(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('outro erro → 500', async () => {
    const { ctrl, req, res } = setup(jest.fn().mockRejectedValue(new Error('DB')), { numero: 3 });
    await ctrl.criar(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
