// Testa o middleware REAL (src/middlewares/mesa.js), sem cópia em /mocks.
const { criarValidarMesa, tokensIguais } = require('../src/middlewares/mesa');

const TOKEN = 'a'.repeat(32);

function setup({ params = { numero: '7' }, headers = {}, query = {}, rows = [{ id: 3, numero: 7, token: TOKEN }], erro } = {}) {
  const pool = {
    query: erro ? jest.fn().mockRejectedValue(erro) : jest.fn().mockResolvedValue({ rows }),
  };
  const req = {
    params,
    query,
    get: (nome) => headers[nome.toLowerCase()],
  };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  const next = jest.fn();
  return { pool, req, res, next, validarMesa: criarValidarMesa(pool) };
}

describe('tokensIguais()', () => {
  test('iguais → true', () => expect(tokensIguais('abc', 'abc')).toBe(true));
  test('diferentes → false', () => expect(tokensIguais('abc', 'abd')).toBe(false));
  test('tamanhos diferentes → false (sem lançar erro)', () => expect(tokensIguais('abc', 'abcd')).toBe(false));
});

describe('validarMesa()', () => {
  test('token válido no header: preenche req.mesa e chama next', async () => {
    const { validarMesa, req, res, next } = setup({ headers: { 'x-mesa-token': TOKEN } });
    await validarMesa(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.mesa).toEqual({ id: 3, numero: 7 });
    expect(res.status).not.toHaveBeenCalled();
  });

  test('token válido na query (?t=) também funciona', async () => {
    const { validarMesa, req, res, next } = setup({ query: { t: TOKEN } });
    await validarMesa(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('só consulta mesas ativas', async () => {
    const { validarMesa, req, res, next, pool } = setup({ headers: { 'x-mesa-token': TOKEN } });
    await validarMesa(req, res, next);
    expect(pool.query.mock.calls[0][0]).toMatch(/ativa = true/);
    expect(pool.query.mock.calls[0][1]).toEqual([7]);
  });

  test('sem token → 401, sem consultar o banco', async () => {
    const { validarMesa, req, res, next, pool } = setup();
    await validarMesa(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(pool.query).not.toHaveBeenCalled();
  });

  test.each(['abc', '0', '-2', ''])('número de mesa inválido (%p) → 401', async (numero) => {
    const { validarMesa, req, res, next } = setup({ params: { numero }, headers: { 'x-mesa-token': TOKEN } });
    await validarMesa(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('mesa inexistente/inativa → 401', async () => {
    const { validarMesa, req, res, next } = setup({ rows: [], headers: { 'x-mesa-token': TOKEN } });
    await validarMesa(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('token errado → 401 com a MESMA mensagem de mesa inexistente', async () => {
    const errado = setup({ headers: { 'x-mesa-token': 'b'.repeat(32) } });
    await errado.validarMesa(errado.req, errado.res, errado.next);
    const inexistente = setup({ rows: [], headers: { 'x-mesa-token': TOKEN } });
    await inexistente.validarMesa(inexistente.req, inexistente.res, inexistente.next);

    expect(errado.res.status).toHaveBeenCalledWith(401);
    expect(errado.res.json.mock.calls[0][0]).toEqual(inexistente.res.json.mock.calls[0][0]);
  });

  test('erro de banco → 500', async () => {
    const { validarMesa, req, res, next } = setup({ erro: new Error('DB'), headers: { 'x-mesa-token': TOKEN } });
    await validarMesa(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });
});
