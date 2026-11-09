const crypto = require('crypto');
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const TOTAL_MESAS_INICIAL = 10;

async function initDB() {
  try {
    // Tabela de usuários
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('proprietario', 'gerente', 'barista')),
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tabela de produtos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS produtos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        preco NUMERIC(10,2) NOT NULL,
        categoria VARCHAR(50) NOT NULL,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tabela de estoque
    await pool.query(`
      CREATE TABLE IF NOT EXISTS estoque (
        id SERIAL PRIMARY KEY,
        produto_id INTEGER REFERENCES produtos(id) ON DELETE CASCADE,
        quantidade INTEGER NOT NULL DEFAULT 0,
        quantidade_minima INTEGER NOT NULL DEFAULT 5,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tabela de pedidos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        status VARCHAR(30) NOT NULL DEFAULT 'pendente'
          CHECK (status IN ('pendente', 'em_preparo', 'pronto', 'entregue', 'cancelado')),
        total NUMERIC(10,2) DEFAULT 0,
        observacao TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tabela de itens do pedido
    await pool.query(`
      CREATE TABLE IF NOT EXISTS itens_pedido (
        id SERIAL PRIMARY KEY,
        pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
        produto_id INTEGER REFERENCES produtos(id),
        quantidade INTEGER NOT NULL,
        preco_unitario NUMERIC(10,2) NOT NULL
      );
    `);

    // ── Pedido por mesa (QR code) ───────────────────────────────────────────
    // Cada mesa tem um número e um token secreto, que vai dentro do QR code.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mesas (
        id SERIAL PRIMARY KEY,
        numero INTEGER UNIQUE NOT NULL CHECK (numero > 0),
        token VARCHAR(64) NOT NULL,
        ativa BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Migrações idempotentes (seguras para bancos que já existem)
    await pool.query(`ALTER TABLE produtos ADD COLUMN IF NOT EXISTS imagem_url TEXT;`);
    await pool.query(`ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS mesa_id INTEGER REFERENCES mesas(id);`);
    await pool.query(`
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS origem VARCHAR(10) NOT NULL DEFAULT 'balcao'
        CHECK (origem IN ('balcao', 'mesa'));
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_pedidos_mesa ON pedidos (mesa_id);`);

    console.log('Tabelas criadas com sucesso.');

    // Seed: Usuários iniciais
    const senhaHash = await bcrypt.hash('123456', 10);

    await pool.query(`
      INSERT INTO usuarios (nome, email, senha, role)
      VALUES
        ('Dono do Café', 'proprietario@cafegrao.com', $1, 'proprietario'),
        ('Gerente João', 'gerente@cafegrao.com', $1, 'gerente'),
        ('Barista Ana', 'barista@cafegrao.com', $1, 'barista')
      ON CONFLICT (email) DO NOTHING;
    `, [senhaHash]);

    // Seed: Produtos iniciais (só quando a tabela está vazia).
    // Antes, o "ON CONFLICT DO NOTHING" não tinha efeito (não há UNIQUE em nome),
    // então cada reinício do servidor duplicava os produtos.
    const { rows: [{ total: totalProdutos }] } = await pool.query(
      'SELECT COUNT(*)::int AS total FROM produtos'
    );
    if (totalProdutos === 0) {
      await pool.query(`
        INSERT INTO produtos (nome, descricao, preco, categoria)
        VALUES
          ('Espresso', 'Café espresso puro', 5.00, 'cafe'),
          ('Cappuccino', 'Espresso com leite vaporizado', 9.00, 'cafe'),
          ('Latte', 'Café com muito leite', 10.00, 'cafe'),
          ('Croissant', 'Croissant de manteiga', 8.00, 'salgado'),
          ('Bolo de Cenoura', 'Bolo caseiro com cobertura de chocolate', 7.00, 'doce');
      `);
    }

    // Seed: Estoque inicial (apenas para produtos que ainda não têm registro)
    await pool.query(`
      INSERT INTO estoque (produto_id, quantidade, quantidade_minima)
      SELECT p.id, 50, 10 FROM produtos p
      WHERE NOT EXISTS (SELECT 1 FROM estoque e WHERE e.produto_id = p.id);
    `);

    // Seed: Mesas iniciais, cada uma com token aleatório
    for (let numero = 1; numero <= TOTAL_MESAS_INICIAL; numero++) {
      await pool.query(
        'INSERT INTO mesas (numero, token) VALUES ($1, $2) ON CONFLICT (numero) DO NOTHING',
        [numero, crypto.randomBytes(16).toString('hex')]
      );
    }

    console.log('Dados iniciais inseridos com sucesso.');
    console.log('');
    console.log('Usuários criados (senha: 123456):');
    console.log('  proprietario@cafegrao.com -> role: proprietario');
    console.log('  gerente@cafegrao.com      -> role: gerente');
    console.log('  barista@cafegrao.com      -> role: barista');

  } catch (err) {
    console.error('Erro ao inicializar banco de dados:', err.message);
  }
}

module.exports = initDB;
