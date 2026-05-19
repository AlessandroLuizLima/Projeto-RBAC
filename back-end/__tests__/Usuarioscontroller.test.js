const { makeController } = require('./mocks/usuariosController.mock');

function makePool(queryFn) { return { query: queryFn }; }
function mockReqRes(body, params) {
  body = body || {};
  params = params || {};
  const req = { body, params };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return { req, res };
}

describe('usuariosController.listar()', () => {
  test('deve retornar lista de usuários sem senha', async () => {
    const usuarios = [
      { id: 1, nome: 'Ana', email: 'ana@cafe.com', role: 'proprietario', ativo: true },
      { id: 2, nome: 'Carlos', email: 'carlos@cafe.com', role: 'barista', ativo: true },
    ];
    const pool = makePool(jest.fn().mockResolvedValue({ rows: usuarios }));
    const { listar } = makeController(pool);
    const { req, res } = mockReqRes();
    await listar(req, res);
    expect(res.json).toHaveBeenCalledWith(usuarios);
    res.json.mock.calls[0][0].forEach(function(u) { expect(u.senha).toBeUndefined(); });
  });

  test('deve retornar 500 em caso de erro', async () => {
    const pool = makePool(jest.fn().mockRejectedValue(new Error('DB')));
    const { listar } = makeController(pool);
    const { req, res } = mockReqRes();
    await listar(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('usuariosController.buscarPorId()', () => {
  test('deve retornar usuário quando encontrado', async () => {
    const usuario = { id: 1, nome: 'Ana', email: 'ana@cafe.com', role: 'proprietario' };
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [usuario] }));
    const { buscarPorId } = makeController(pool);
    const { req, res } = mockReqRes({}, { id: '1' });
    await buscarPorId(req, res);
    expect(res.json).toHaveBeenCalledWith(usuario);
  });

  test('deve retornar 404 se usuário não existir', async () => {
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

describe('usuariosController.criar()', () => {
  test('deve retornar 400 se campo obrigatório estiver ausente', async () => {
    const casos = [
      { nome: '', email: 'x@cafe.com', senha: '123', role: 'barista' },
      { nome: 'X', email: '', senha: '123', role: 'barista' },
      { nome: 'X', email: 'x@cafe.com', senha: '', role: 'barista' },
      { nome: 'X', email: 'x@cafe.com', senha: '123', role: '' },
    ];
    var i;
    for (i = 0; i < casos.length; i++) {
      const pool = makePool(jest.fn());
      const { criar } = makeController(pool);
      const { req, res } = mockReqRes(casos[i]);
      await criar(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    }
  });

  test('deve retornar 400 para role inválida', async () => {
    const pool = makePool(jest.fn());
    const { criar } = makeController(pool);
    const { req, res } = mockReqRes({ nome: 'X', email: 'x@cafe.com', senha: '123', role: 'admin' });
    await criar(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ erro: expect.stringContaining('Role') }));
  });

  test('deve criar usuário com sucesso e retornar 201', async () => {
    const novoUsuario = { id: 5, nome: 'Joao', email: 'joao@cafe.com', role: 'barista', ativo: true };
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [novoUsuario] }));
    const { criar } = makeController(pool);
    const { req, res } = mockReqRes({ nome: 'Joao', email: 'joao@cafe.com', senha: 'senha123', role: 'barista' });
    await criar(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(novoUsuario);
  });

  test('deve retornar 409 se email já estiver cadastrado', async () => {
    const err = Object.assign(new Error('Duplicado'), { code: '23505' });
    const pool = makePool(jest.fn().mockRejectedValue(err));
    const { criar } = makeController(pool);
    const { req, res } = mockReqRes({ nome: 'Ana', email: 'ana@cafe.com', senha: '123', role: 'gerente' });
    await criar(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('deve retornar 500 para erro generico no banco', async () => {
    const pool = makePool(jest.fn().mockRejectedValue(new Error('Outro erro')));
    const { criar } = makeController(pool);
    const { req, res } = mockReqRes({ nome: 'X', email: 'x@cafe.com', senha: '123', role: 'barista' });
    await criar(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('roles validas devem ser aceitas', async () => {
    const roles = ['proprietario', 'gerente', 'barista'];
    var i;
    for (i = 0; i < roles.length; i++) {
      const role = roles[i];
      const novoUsuario = { id: 1, nome: 'Teste', email: role + '@cafe.com', role: role };
      const pool = makePool(jest.fn().mockResolvedValue({ rows: [novoUsuario] }));
      const { criar } = makeController(pool);
      const { req, res } = mockReqRes({ nome: 'Teste', email: role + '@cafe.com', senha: '123456', role: role });
      await criar(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    }
  });
});

describe('usuariosController.atualizar()', () => {
  test('deve retornar usuário atualizado', async () => {
    const atualizado = { id: 1, nome: 'Ana Silva', email: 'ana@cafe.com', role: 'gerente', ativo: true };
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [atualizado] }));
    const { atualizar } = makeController(pool);
    const { req, res } = mockReqRes({ nome: 'Ana Silva' }, { id: '1' });
    await atualizar(req, res);
    expect(res.json).toHaveBeenCalledWith(atualizado);
  });

  test('deve retornar 404 se usuário não existir', async () => {
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

describe('usuariosController.remover()', () => {
  test('deve remover usuário e retornar mensagem de sucesso', async () => {
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [{ id: 1 }] }));
    const { remover } = makeController(pool);
    const { req, res } = mockReqRes({}, { id: '1' });
    await remover(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensagem: expect.any(String) }));
  });

  test('deve retornar 404 se usuário não existir', async () => {
    const pool = makePool(jest.fn().mockResolvedValue({ rows: [] }));
    const { remover } = makeController(pool);
    const { req, res } = mockReqRes({}, { id: '999' });
    await remover(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('deve retornar 500 em caso de erro', async () => {
    const pool = makePool(jest.fn().mockRejectedValue(new Error('DB')));
    const { remover } = makeController(pool);
    const { req, res } = mockReqRes({}, { id: '1' });
    await remover(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});