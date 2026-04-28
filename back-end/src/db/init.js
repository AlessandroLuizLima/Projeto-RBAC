const pool = require('../config/database');
const bcrypt = require('bcryptjs');

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

    // Seed: Produtos iniciais
    await pool.query(`
      INSERT INTO produtos (nome, descricao, preco, categoria)
      VALUES
        ('Espresso', 'Café espresso puro', 5.00, 'cafe'),
        ('Cappuccino', 'Espresso com leite vaporizado', 9.00, 'cafe'),
        ('Latte', 'Café com muito leite', 10.00, 'cafe'),
        ('Croissant', 'Croissant de manteiga', 8.00, 'salgado'),
        ('Bolo de Cenoura', 'Bolo caseiro com cobertura de chocolate', 7.00, 'doce')
      ON CONFLICT DO NOTHING;
    `);

    // Seed: Estoque inicial
    await pool.query(`
      INSERT INTO estoque (produto_id, quantidade, quantidade_minima)
      SELECT id, 50, 10 FROM produtos
      ON CONFLICT DO NOTHING;
    `);

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