// Testa o controller REAL (src/controllers/publicoController.js).
const {
  criarPublicoController,
  normalizarItens,
  normalizarObservacao,
  LIMITES,
} = require('../src/controllers/publicoController');

const MESA = { id: 3, numero: 7 };

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
}

// Cliente de banco falso que "entende" as queries do controller.
function fakeClient({ produtos = {}, estoque = {}, falharEm } = {}) {
  const chamadas = [];
  const client = {
    chamadas,
    release: jest.fn(),
    query: jest.fn(async (sql, params = []) => {
      const s = sql.replace(/\s+/g, ' ').trim();
      chamadas.push({ sql: s, params });
      if (falharEm && falharEm.test(s)) throw new Error('falha simulada');
      if (/^SELECT id, nome, preco FROM produtos/.test(s)) {
        const p = produtos[params[0]];
        return { rows: p ? [{ id: params[0], ...p }] : [] };
      }
      if (/^SELECT quantidade FROM estoque/.test(s)) {
        const q = estoque[params[0]];
        return { rows: q === undefined ? [] : [{ quantidade: q }] };
      }
      if (/^INSERT INTO pedidos/.test(s)) {
        return { rows: [{ id: 55, status: 'pendente', total: params[2], created_at: 'agora' }] };
      }
      return { rows: [] };
    }),
  };
  return client;
}

function setupPedido(body, clientOpts) {
  const client = fakeClient(clientOpts);
  const pool = { connect: jest.fn().mockResolvedValue(client), query: jest.fn() };
  const ctrl = criarPublicoController(pool);
  const req = { body, mesa: MESA };
  const res = mockRes();
  return { ctrl, req, res, client, pool };
}

const comando = (client, nome) => client.chamadas.map((c) => c.sql).includes(nome);
const houveCommit = (c) => comando(c, 'COMMIT');
const houveRollback = (c) => comando(c, 'ROLLBACK');

const PRODUTOS = { 1: { nome: 'Espresso', preco: '5.00' }, 2: { nome: 'Cappuccino', preco: '9.00' } };

describe('normalizarItens()', () => {
  test('junta o mesmo produto repetido e ordena por id', () => {
    const r = normalizarItens([
      { produto_id: 2, quantidade: 1 },
      { produto_id: 1, quantidade: 1 },
      { produto_id: 2, quantidade: 2 },
    ]);
    expect(r.itens).toEqual([
      { produto_id: 1, quantidade: 1 },
      { produto_id: 2, quantidade: 3 },
    ]);
  });

  test.each([undefined, null, [], 'x', {}])('itens inválidos (%p) → erro', (v) => {
    expect(normalizarItens(v).erro).toBeDefined();
  });

  test('item nulo → erro', () => expect(normalizarItens([null]).erro).toBeDefined());

  test('mais itens diferentes que o limite → erro', () => {
    const muitos = Array.from({ length: LIMITES.maxItensDistintos + 1 }, (_, i) => ({ produto_id: i + 1, quantidade: 1 }));
    expect(normalizarItens(muitos).erro).toMatch(/no máximo/);
  });

  test('exatamente no limite de itens → ok', () => {
    const lim = Array.from({ length: LIMITES.maxItensDistintos }, (_, i) => ({ produto_id: i + 1, quantidade: 1 }));
    expect(normalizarItens(lim).itens).toHaveLength(LIMITES.maxItensDistintos);
  });

  test.each([0, -1, 1.5, '1', null, undefined])('produto_id inválido (%p)', (id) => {
    expect(normalizarItens([{ produto_id: id, quantidade: 1 }]).erro).toMatch(/produto/i);
  });

  test.each([0, -1, 1.5, '2', null, undefined])('quantidade inválida (%p)', (q) => {
    expect(normalizarItens([{ produto_id: 1, quantidade: q }]).erro).toMatch(/quantidade/i);
  });

  test('quantidade no limite → ok; acima → erro', () => {
    expect(normalizarItens([{ produto_id: 1, quantidade: LIMITES.maxQuantidadePorItem }]).itens).toBeDefined();
    expect(normalizarItens([{ produto_id: 1, quantidade: LIMITES.maxQuantidadePorItem + 1 }]).erro).toBeDefined();
  });

  test('limite vale DEPOIS de somar duplicados (não dá pra burlar repetindo o item)', () => {
    const r = normalizarItens([
      { produto_id: 1, quantidade: 6 },
      { produto_id: 1, quantidade: 6 },
    ]);
    expect(r.erro).toBeDefined();
  });
});

describe('normalizarObservacao()', () => {
  test('ausente → null', () => {
    expect(normalizarObservacao(undefined)).toEqual({ observacao: null });
    expect(normalizarObservacao(null)).toEqual({ observacao: null });
  });
  test('faz trim e vazio vira null', () => {
    expect(normalizarObservacao('  sem açúcar  ')).toEqual({ observacao: 'sem açúcar' });
    expect(normalizarObservacao('   ')).toEqual({ observacao: null });
  });
  test('não-string → erro', () => expect(normalizarObservacao(123).erro).toBeDefined());
  test('acima do limite → erro; no limite → ok', () => {
    expect(normalizarObservacao('a'.repeat(LIMITES.maxObservacao + 1)).erro).toBeDefined();
    expect(normalizarObservacao('a'.repeat(LIMITES.maxObservacao)).observacao).toHaveLength(LIMITES.maxObservacao);
  });
});

describe('publicoController.cardapio()', () => {
  test('devolve mesa e produtos, sem expor a quantidade exata do estoque', async () => {
    const produtos = [{ id: 1, nome: 'Espresso', preco: '5.00', disponivel: true }];
    const pool = { query: jest.fn().mockResolvedValue({ rows: produtos }) };
    const res = mockRes();
    await criarPublicoController(pool).cardapio({ mesa: MESA }, res);
    expect(res.json).toHaveBeenCalledWith({ mesa: 7, produtos });
    const sql = pool.query.mock.calls[0][0];
    expect(sql).toMatch(/ativo = true/);
    expect(sql).toMatch(/AS disponivel/);
    expect(sql).not.toMatch(/SELECT p\.\*/);
    expect(sql).not.toMatch(/e\.quantidade AS/);
  });

  test('erro → 500', async () => {
    const pool = { query: jest.fn().mockRejectedValue(new Error('DB')) };
    const res = mockRes();
    await criarPublicoController(pool).cardapio({ mesa: MESA }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('publicoController.criarPedido()', () => {
  test('sucesso: 201, total calculado pelo banco, commit e release', async () => {
    const { ctrl, req, res, client } = setupPedido(
      { itens: [{ produto_id: 1, quantidade: 1 }, { produto_id: 2, quantidade: 2 }], observacao: 'Sem açúcar' },
      { produtos: PRODUTOS, estoque: { 1: 10, 2: 10 } }
    );
    await ctrl.criarPedido(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 55, mesa: 7, status: 'pendente', total: 23 }); // 5 + 2×9
    expect(houveCommit(client)).toBe(true);
    expect(houveRollback(client)).toBe(false);
    expect(client.release).toHaveBeenCalledTimes(1);

    const insertPedido = client.chamadas.find((c) => /^INSERT INTO pedidos/.test(c.sql));
    expect(insertPedido.params).toEqual([3, 'Sem açúcar', 23]); // mesa_id, observação, total
    expect(insertPedido.sql).toMatch(/'mesa'/);
  });

  test('desconta o estoque de cada item', async () => {
    const { ctrl, req, res, client } = setupPedido(
      { itens: [{ produto_id: 2, quantidade: 3 }] },
      { produtos: PRODUTOS, estoque: { 2: 10 } }
    );
    await ctrl.criarPedido(req, res);
    const upd = client.chamadas.find((c) => /^UPDATE estoque/.test(c.sql));
    expect(upd.params).toEqual([3, 2]);
  });

  test('trava a linha de estoque com FOR UPDATE (evita vender o mesmo item 2×)', async () => {
    const { ctrl, req, res, client } = setupPedido(
      { itens: [{ produto_id: 1, quantidade: 1 }] },
      { produtos: PRODUTOS, estoque: { 1: 10 } }
    );
    await ctrl.criarPedido(req, res);
    expect(client.chamadas.find((c) => /FROM estoque/.test(c.sql)).sql).toMatch(/FOR UPDATE$/);
  });

  test('IGNORA preço enviado pelo cliente: usa sempre o do banco', async () => {
    const { ctrl, req, res, client } = setupPedido(
      { itens: [{ produto_id: 1, quantidade: 2, preco: 0.01, preco_unitario: 0.01 }], total: 0.02 },
      { produtos: PRODUTOS, estoque: { 1: 10 } }
    );
    await ctrl.criarPedido(req, res);
    const item = client.chamadas.find((c) => /^INSERT INTO itens_pedido/.test(c.sql));
    expect(item.params).toEqual([55, 1, 2, '5.00']);
    expect(res.json.mock.calls[0][0].total).toBe(10);
  });

  test('mesmo produto 2× no body vira UMA linha com a soma', async () => {
    const { ctrl, req, res, client } = setupPedido(
      { itens: [{ produto_id: 1, quantidade: 1 }, { produto_id: 1, quantidade: 2 }] },
      { produtos: PRODUTOS, estoque: { 1: 10 } }
    );
    await ctrl.criarPedido(req, res);
    const linhas = client.chamadas.filter((c) => /^INSERT INTO itens_pedido/.test(c.sql));
    expect(linhas).toHaveLength(1);
    expect(linhas[0].params[2]).toBe(3);
  });

  test('total sem erro de ponto flutuante (0.10 × 3 = 0.30)', async () => {
    const { ctrl, req, res } = setupPedido(
      { itens: [{ produto_id: 1, quantidade: 3 }] },
      { produtos: { 1: { nome: 'Bala', preco: '0.10' } }, estoque: { 1: 10 } }
    );
    await ctrl.criarPedido(req, res);
    expect(res.json.mock.calls[0][0].total).toBe(0.3);
  });

  test('observação vazia é gravada como null', async () => {
    const { ctrl, req, res, client } = setupPedido(
      { itens: [{ produto_id: 1, quantidade: 1 }], observacao: '   ' },
      { produtos: PRODUTOS, estoque: { 1: 10 } }
    );
    await ctrl.criarPedido(req, res);
    expect(client.chamadas.find((c) => /^INSERT INTO pedidos/.test(c.sql)).params[1]).toBeNull();
  });

  test.each([
    ['sem itens', { itens: [] }],
    ['body vazio', undefined],
    ['produto_id inválido', { itens: [{ produto_id: 'x', quantidade: 1 }] }],
    ['quantidade acima do limite', { itens: [{ produto_id: 1, quantidade: 999 }] }],
    ['observação grande demais', { itens: [{ produto_id: 1, quantidade: 1 }], observacao: 'a'.repeat(500) }],
    ['observação não-string', { itens: [{ produto_id: 1, quantidade: 1 }], observacao: { a: 1 } }],
  ])('400 sem tocar no banco: %s', async (_nome, body) => {
    const { ctrl, req, res, pool } = setupPedido(body);
    await ctrl.criarPedido(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(pool.connect).not.toHaveBeenCalled();
  });

  test('produto inexistente/inativo → 400, rollback, nada gravado', async () => {
    const { ctrl, req, res, client } = setupPedido(
      { itens: [{ produto_id: 99, quantidade: 1 }] },
      { produtos: PRODUTOS, estoque: {} }
    );
    await ctrl.criarPedido(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(houveRollback(client)).toBe(true);
    expect(houveCommit(client)).toBe(false);
    expect(client.chamadas.some((c) => /^INSERT/.test(c.sql))).toBe(false);
    expect(client.release).toHaveBeenCalled();
  });

  test('estoque insuficiente → 409, rollback, nada gravado', async () => {
    const { ctrl, req, res, client } = setupPedido(
      { itens: [{ produto_id: 1, quantidade: 5 }] },
      { produtos: PRODUTOS, estoque: { 1: 2 } }
    );
    await ctrl.criarPedido(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(houveRollback(client)).toBe(true);
    expect(client.chamadas.some((c) => /^INSERT/.test(c.sql))).toBe(false);
  });

  test('produto sem registro de estoque → 409 (não estoura erro)', async () => {
    const { ctrl, req, res } = setupPedido(
      { itens: [{ produto_id: 1, quantidade: 1 }] },
      { produtos: PRODUTOS, estoque: {} }
    );
    await ctrl.criarPedido(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('item 2 sem estoque derruba o pedido inteiro (nada do item 1 é gravado)', async () => {
    const { ctrl, req, res, client } = setupPedido(
      { itens: [{ produto_id: 1, quantidade: 1 }, { produto_id: 2, quantidade: 1 }] },
      { produtos: PRODUTOS, estoque: { 1: 10, 2: 0 } }
    );
    await ctrl.criarPedido(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(client.chamadas.some((c) => /^UPDATE estoque|^INSERT/.test(c.sql))).toBe(false);
  });

  test('erro inesperado no meio → 500, rollback e release', async () => {
    const { ctrl, req, res, client } = setupPedido(
      { itens: [{ produto_id: 1, quantidade: 1 }] },
      { produtos: PRODUTOS, estoque: { 1: 10 }, falharEm: /^INSERT INTO itens_pedido/ }
    );
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await ctrl.criarPedido(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(houveRollback(client)).toBe(true);
    expect(houveCommit(client)).toBe(false);
    expect(client.release).toHaveBeenCalledTimes(1);
    console.error.mockRestore();
  });

  test('se o próprio ROLLBACK falhar, ainda responde 500 e libera a conexão', async () => {
    const { ctrl, req, res, client } = setupPedido(
      { itens: [{ produto_id: 1, quantidade: 1 }] },
      { produtos: PRODUTOS, estoque: { 1: 10 }, falharEm: /^INSERT INTO pedidos|^ROLLBACK/ }
    );
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await ctrl.criarPedido(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(client.release).toHaveBeenCalledTimes(1);
    console.error.mockRestore();
  });

  test('falha ao obter conexão do pool → 500 (e não tenta liberar nada)', async () => {
    const pool = { connect: jest.fn().mockRejectedValue(new Error('pool cheio')) };
    const res = mockRes();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await criarPublicoController(pool).criarPedido(
      { body: { itens: [{ produto_id: 1, quantidade: 1 }] }, mesa: MESA },
      res
    );
    expect(res.status).toHaveBeenCalledWith(500);
    console.error.mockRestore();
  });
});

describe('publicoController.statusPedido()', () => {
  test('retorna o pedido da própria mesa (filtra por id E mesa_id)', async () => {
    const pedido = { id: 55, status: 'em_preparo', itens: [] };
    const pool = { query: jest.fn().mockResolvedValue({ rows: [pedido] }) };
    const res = mockRes();
    await criarPublicoController(pool).statusPedido({ params: { id: '55' }, mesa: MESA }, res);
    expect(res.json).toHaveBeenCalledWith(pedido);
    expect(pool.query.mock.calls[0][1]).toEqual([55, 3]);
    expect(pool.query.mock.calls[0][0]).toMatch(/p\.mesa_id = \$2/);
  });

  test('pedido de outra mesa/inexistente → 404', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const res = mockRes();
    await criarPublicoController(pool).statusPedido({ params: { id: '55' }, mesa: MESA }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test.each(['abc', '0', '-1'])('id inválido (%p) → 404 sem consultar o banco', async (id) => {
    const pool = { query: jest.fn() };
    const res = mockRes();
    await criarPublicoController(pool).statusPedido({ params: { id }, mesa: MESA }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('erro → 500', async () => {
    const pool = { query: jest.fn().mockRejectedValue(new Error('DB')) };
    const res = mockRes();
    await criarPublicoController(pool).statusPedido({ params: { id: '1' }, mesa: MESA }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
