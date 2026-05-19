const { makeController } = require('./mocks/pedidosController.mock');

function makePool(queryFn, connectFn) {
  return { query: queryFn || jest.fn(), connect: connectFn || jest.fn() };
}
function mockReqRes(body, params, usuario) {
  body = body || {};
  params = params || {};
  usuario = usuario || { id: 1, role: 'gerente' };
  const req = { body, params, usuario };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return { req, res };
}
function makeClient(responses) {
  responses = responses || [];
  const client = { query: jest.fn(), release: jest.fn() };
  responses.forEach(function(r) {
    if (r instanceof Error) client.query.mockRejectedValueOnce(r);
    else client.query.mockResolvedValueOnce(r);
  });
  return client;
}

describe('pedidosController.listar()', () => {
  test('gerente deve ver todos os pedidos', async () => {
    const pedidos = [{ id: 1, status: 'pendente' }, { id: 2, status: 'entregue' }];
    const queryFn = jest.fn().mockResolvedValue({ rows: pedidos });
    const pool = makePool(queryFn);
    const { listar } = makeController(pool);
    const { req, res } = mockReqRes({}, {}, { id: 1, role: 'gerente' });
    await listar(req, res);
    expect(res.json).toHaveBeenCalledWith(pedidos);
    expect(queryFn.mock.calls[0][0]).not.toMatch(/pendente|em_preparo/);
  });

  test('barista deve receber query filtrada por status', async () => {
    const pedidos = [{ id: 1, status: 'pendente' }];
    const queryFn = jest.fn().mockResolvedValue({ rows: pedidos });
    const pool = makePool(queryFn);
    const { listar } = makeController(pool);
    const { req, res } = mockReqRes({}, {}, { id: 2, role: 'barista' });
    await listar(req, res);
    expect(queryFn.mock.calls[0][0]).toMatch(/pendente|em_preparo/);
    expect(res.json).toHaveBeenCalledWith(pedidos);
  });

  test('deve retornar 500 em caso de erro', async () => {
    const pool = makePool(jest.fn().mockRejectedValue(new Error('DB')));
    const { listar } = makeController(pool);
    const { req, res } = mockReqRes();
    await listar(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('pedidosController.buscarPorId()', () => {
  test('deve retornar pedido quando encontrado', async () => {
    const pedido = { id: 1, status: 'pendente', total: 15.0 };
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [pedido] }));
    const { buscarPorId } = makeController(pool);
    const { req, res } = mockReqRes({}, { id: '1' });
    await buscarPorId(req, res);
    expect(res.json).toHaveBeenCalledWith(pedido);
  });

  test('deve retornar 404 se pedido não existir', async () => {
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [] }));
    const { buscarPorId } = makeController(pool);
    const { req, res } = mockReqRes({}, { id: '999' });
    await buscarPorId(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('deve retornar 500 em caso de erro no banco', async () => {
    const pool = makePool(jest.fn().mockRejectedValue(new Error('DB')));
    const { buscarPorId } = makeController(pool);
    const { req, res } = mockReqRes({}, { id: '1' });
    await buscarPorId(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('pedidosController.criar()', () => {
  test('deve retornar 400 se itens estiver vazio', async () => {
    const pool = makePool(jest.fn());
    const { criar } = makeController(pool);
    const { req, res } = mockReqRes({ itens: [] });
    await criar(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('deve retornar 400 se itens não for enviado', async () => {
    const pool = makePool(jest.fn());
    const { criar } = makeController(pool);
    const { req, res } = mockReqRes({});
    await criar(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('deve criar pedido com sucesso e retornar 201', async () => {
    const pedidoCriado = { id: 10, total: 10.0, status: 'pendente' };
    const client = makeClient([
      undefined,
      { rows: [{ id: 10 }] },
      { rows: [{ id: 1, preco: 5.0, nome: 'Espresso', ativo: true }] },
      { rows: [{ quantidade: 20 }] },
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [pedidoCriado] }), jest.fn().mockResolvedValue(client));
    const { criar } = makeController(pool);
    const { req, res } = mockReqRes({ itens: [{ produto_id: 1, quantidade: 2 }], observacao: 'Sem acucar' });
    await criar(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(client.release).toHaveBeenCalled();
  });

  test('deve retornar 404 se produto do item não existir', async () => {
    const client = makeClient([undefined, { rows: [{ id: 10 }] }, { rows: [] }]);
    const pool = makePool(jest.fn(), jest.fn().mockResolvedValue(client));
    const { criar } = makeController(pool);
    const { req, res } = mockReqRes({ itens: [{ produto_id: 99, quantidade: 1 }] });
    await criar(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(client.release).toHaveBeenCalled();
  });

  test('deve retornar 400 se estoque for insuficiente', async () => {
    const client = makeClient([
      undefined,
      { rows: [{ id: 10 }] },
      { rows: [{ id: 1, preco: 5.0, nome: 'Espresso', ativo: true }] },
      { rows: [{ quantidade: 1 }] },
    ]);
    const pool = makePool(jest.fn(), jest.fn().mockResolvedValue(client));
    const { criar } = makeController(pool);
    const { req, res } = mockReqRes({ itens: [{ produto_id: 1, quantidade: 5 }] });
    await criar(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ erro: expect.stringContaining('insuficiente') }));
    expect(client.release).toHaveBeenCalled();
  });

  test('deve fazer ROLLBACK e retornar 500 em erro inesperado na transacao', async () => {
    const client = makeClient([
      undefined,
      { rows: [{ id: 10 }] },
      { rows: [{ id: 1, preco: 5.0, nome: 'Espresso', ativo: true }] },
      { rows: [{ quantidade: 20 }] },
      undefined,
      new Error('Falha inesperada no UPDATE estoque'),
    ]);
    const pool = makePool(jest.fn(), jest.fn().mockResolvedValue(client));
    const { criar } = makeController(pool);
    const { req, res } = mockReqRes({ itens: [{ produto_id: 1, quantidade: 2 }] });
    await criar(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(client.release).toHaveBeenCalled();
  });
});

describe('pedidosController.atualizarStatus()', () => {
  test('deve atualizar status com sucesso', async () => {
    const pedido = { id: 1, status: 'em_preparo' };
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [pedido] }));
    const { atualizarStatus } = makeController(pool);
    const { req, res } = mockReqRes({ status: 'em_preparo' }, { id: '1' });
    await atualizarStatus(req, res);
    expect(res.json).toHaveBeenCalledWith(pedido);
  });

  test('deve retornar 400 para status invalido', async () => {
    const pool = makePool(jest.fn());
    const { atualizarStatus } = makeController(pool);
    const { req, res } = mockReqRes({ status: 'voando' }, { id: '1' });
    await atualizarStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('barista nao pode cancelar pedido', async () => {
    const pool = makePool(jest.fn());
    const { atualizarStatus } = makeController(pool);
    const { req, res } = mockReqRes({ status: 'cancelado' }, { id: '1' }, { id: 2, role: 'barista' });
    await atualizarStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('gerente pode cancelar pedido', async () => {
    const pedido = { id: 1, status: 'cancelado' };
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [pedido] }));
    const { atualizarStatus } = makeController(pool);
    const { req, res } = mockReqRes({ status: 'cancelado' }, { id: '1' }, { id: 1, role: 'gerente' });
    await atualizarStatus(req, res);
    expect(res.json).toHaveBeenCalledWith(pedido);
  });

  test('deve retornar 404 se pedido nao existir', async () => {
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [] }));
    const { atualizarStatus } = makeController(pool);
    const { req, res } = mockReqRes({ status: 'pronto' }, { id: '999' });
    await atualizarStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('deve retornar 500 em caso de erro no banco', async () => {
    const pool = makePool(jest.fn().mockRejectedValue(new Error('DB')));
    const { atualizarStatus } = makeController(pool);
    const { req, res } = mockReqRes({ status: 'pronto' }, { id: '1' });
    await atualizarStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('pedidosController.remover()', () => {
  test('deve remover pedido e retornar mensagem de sucesso', async () => {
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [{ id: 1 }] }));
    const { remover } = makeController(pool);
    const { req, res } = mockReqRes({}, { id: '1' });
    await remover(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensagem: expect.any(String) }));
  });

  test('deve retornar 404 se pedido nao existir', async () => {
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