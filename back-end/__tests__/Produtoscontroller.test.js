const { makeController } = require('./mocks/produtosController.mock');

function makePool(queryFn, connectFn) {
  return { query: queryFn || jest.fn(), connect: connectFn || jest.fn() };
}
function mockReqRes(body = {}, params = {}) {
  const req = { body, params };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return { req, res };
}
function makeClient(responses = []) {
  const client = { query: jest.fn(), release: jest.fn() };
  responses.forEach(r => r instanceof Error ? client.query.mockRejectedValueOnce(r) : client.query.mockResolvedValueOnce(r));
  return client;
}

describe('produtosController.listar()', () => {
  test('deve retornar lista de produtos', async () => {
    const produtos = [{ id: 1, nome: 'Espresso', estoque: 20 }];
    const pool = makePool(jest.fn().mockResolvedValue({ rows: produtos }));
    const { listar } = makeController(pool);
    const { req, res } = mockReqRes();
    await listar(req, res);
    expect(res.json).toHaveBeenCalledWith(produtos);
  });

  test('deve retornar 500 em caso de erro', async () => {
    const pool = makePool(jest.fn().mockRejectedValue(new Error('DB')));
    const { listar } = makeController(pool);
    const { req, res } = mockReqRes();
    await listar(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('produtosController.buscarPorId()', () => {
  test('deve retornar produto quando encontrado', async () => {
    const produto = { id: 1, nome: 'Espresso' };
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [produto] }));
    const { buscarPorId } = makeController(pool);
    const { req, res } = mockReqRes({}, { id: '1' });
    await buscarPorId(req, res);
    expect(res.json).toHaveBeenCalledWith(produto);
  });

  test('deve retornar 404 se produto não existir', async () => {
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [] }));
    const { buscarPorId } = makeController(pool);
    const { req, res } = mockReqRes({}, { id: '999' });
    await buscarPorId(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('deve retornar 500 em caso de erro', async () => {
    const pool = makePool(jest.fn().mockRejectedValue(new Error('DB')));
    const { buscarPorId } = makeController(pool);
    const { req, res } = mockReqRes({}, { id: '1' });
    await buscarPorId(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('produtosController.criar()', () => {
  test('deve retornar 400 se campos obrigatórios estiverem ausentes', async () => {
    const pool = makePool(jest.fn());
    const { criar } = makeController(pool);
    const { req, res } = mockReqRes({ nome: '', preco: '', categoria: '' });
    await criar(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('deve criar produto e retornar 201', async () => {
    const novoProduto = { id: 10, nome: 'Latte', preco: 9.0, categoria: 'bebida' };
    const client = makeClient([undefined, { rows: [novoProduto] }, undefined, undefined]);
    const pool = makePool(jest.fn(), jest.fn().mockResolvedValue(client));
    const { criar } = makeController(pool);
    const { req, res } = mockReqRes({ nome: 'Latte', descricao: 'Com leite', preco: 9.0, categoria: 'bebida' });
    await criar(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(novoProduto);
    expect(client.release).toHaveBeenCalled();
  });

  test('deve fazer ROLLBACK e retornar 500 em caso de erro', async () => {
    const client = makeClient([undefined, new Error('Falha INSERT')]);
    const pool = makePool(jest.fn(), jest.fn().mockResolvedValue(client));
    const { criar } = makeController(pool);
    const { req, res } = mockReqRes({ nome: 'Latte', preco: 9.0, categoria: 'bebida' });
    await criar(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(client.release).toHaveBeenCalled();
  });
});

describe('produtosController.atualizar()', () => {
  test('deve retornar produto atualizado', async () => {
    const atualizado = { id: 1, nome: 'Espresso Plus' };
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [atualizado] }));
    const { atualizar } = makeController(pool);
    const { req, res } = mockReqRes({ nome: 'Espresso Plus' }, { id: '1' });
    await atualizar(req, res);
    expect(res.json).toHaveBeenCalledWith(atualizado);
  });

  test('deve retornar 404 se produto não existir', async () => {
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [] }));
    const { atualizar } = makeController(pool);
    const { req, res } = mockReqRes({ nome: 'X' }, { id: '999' });
    await atualizar(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
  test('deve retornar 500 em caso de erro no banco', async () => {
    const pool = makePool(jest.fn().mockRejectedValue(new Error('DB')));
    const { atualizar } = makeController(pool);
    const { req, res } = mockReqRes({ nome: 'X' }, { id: '1' });
    await atualizar(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('produtosController.remover()', () => {
  test('deve retornar mensagem de sucesso ao remover', async () => {
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [{ id: 1 }] }));
    const { remover } = makeController(pool);
    const { req, res } = mockReqRes({}, { id: '1' });
    await remover(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensagem: expect.any(String) }));
  });

  test('deve retornar 404 se produto não existir', async () => {
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [] }));
    const { remover } = makeController(pool);
    const { req, res } = mockReqRes({}, { id: '999' });
    await remover(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('deve retornar 500 em caso de erro no banco', async () => {
    const pool = makePool(jest.fn().mockRejectedValue(new Error('DB')));
    const { remover } = makeController(pool);
    const { req, res } = mockReqRes({}, { id: '1' });
    await remover(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});