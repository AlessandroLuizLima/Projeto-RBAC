const { makeController } = require('./mocks/estoqueController.mock');

function makePool(queryFn) { return { query: queryFn }; }
function mockReqRes(body = {}, params = {}) {
  const req = { body, params };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return { req, res };
}

describe('estoqueController.listar()', () => {
  test('deve retornar lista completa do estoque', async () => {
    const estoque = [{ id: 1, produto_nome: 'Espresso', quantidade: 20, quantidade_minima: 5 }];
    const pool = makePool(jest.fn().mockResolvedValue({ rows: estoque }));
    const { listar } = makeController(pool);
    const { req, res } = mockReqRes();
    await listar(req, res);
    expect(res.json).toHaveBeenCalledWith(estoque);
  });

  test('deve retornar 500 em caso de erro', async () => {
    const pool = makePool(jest.fn().mockRejectedValue(new Error('DB')));
    const { listar } = makeController(pool);
    const { req, res } = mockReqRes();
    await listar(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('estoqueController.listarBaixo()', () => {
  test('deve retornar apenas itens abaixo do mínimo', async () => {
    const itensBaixos = [{ id: 2, produto_nome: 'Cappuccino', quantidade: 2, quantidade_minima: 5 }];
    const pool = makePool(jest.fn().mockResolvedValue({ rows: itensBaixos }));
    const { listarBaixo } = makeController(pool);
    const { req, res } = mockReqRes();
    await listarBaixo(req, res);
    expect(res.json).toHaveBeenCalledWith(itensBaixos);
  });

  test('deve retornar lista vazia se tudo estiver no nível correto', async () => {
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [] }));
    const { listarBaixo } = makeController(pool);
    const { req, res } = mockReqRes();
    await listarBaixo(req, res);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  test('deve retornar 500 em caso de erro', async () => {
    const pool = makePool(jest.fn().mockRejectedValue(new Error('DB')));
    const { listarBaixo } = makeController(pool);
    const { req, res } = mockReqRes();
    await listarBaixo(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('estoqueController.atualizar()', () => {
  test('deve retornar 400 se quantidade não for enviada', async () => {
    const pool = makePool(jest.fn());
    const { atualizar } = makeController(pool);
    const { req, res } = mockReqRes({}, { produto_id: '1' });
    await atualizar(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('deve atualizar e retornar o estoque', async () => {
    const atualizado = { produto_id: 1, quantidade: 30, quantidade_minima: 5 };
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [atualizado] }));
    const { atualizar } = makeController(pool);
    const { req, res } = mockReqRes({ quantidade: 30 }, { produto_id: '1' });
    await atualizar(req, res);
    expect(res.json).toHaveBeenCalledWith(atualizado);
  });

  test('deve atualizar quantidade_minima junto com quantidade', async () => {
    const atualizado = { produto_id: 1, quantidade: 15, quantidade_minima: 10 };
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [atualizado] }));
    const { atualizar } = makeController(pool);
    const { req, res } = mockReqRes({ quantidade: 15, quantidade_minima: 10 }, { produto_id: '1' });
    await atualizar(req, res);
    expect(res.json).toHaveBeenCalledWith(atualizado);
  });

  test('deve retornar 404 se produto_id não existir no estoque', async () => {
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [] }));
    const { atualizar } = makeController(pool);
    const { req, res } = mockReqRes({ quantidade: 10 }, { produto_id: '999' });
    await atualizar(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('deve retornar 500 em caso de erro no banco', async () => {
    const pool = makePool(jest.fn().mockRejectedValue(new Error('DB')));
    const { atualizar } = makeController(pool);
    const { req, res } = mockReqRes({ quantidade: 10 }, { produto_id: '1' });
    await atualizar(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});