require('dotenv').config();
const express = require('express');
const cors = require('cors');
const initDB = require('./src/db/init');

const authRoutes = require('./src/routes/auth');
const usuariosRoutes = require('./src/routes/usuarios');
const produtosRoutes = require('./src/routes/produtos');
const estoqueRoutes = require('./src/routes/estoque');
const pedidosRoutes = require('./src/routes/pedidos');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/pedidos', pedidosRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', servico: 'Café Grão API' }));

// Rota não encontrada
app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

// Inicializa banco e sobe servidor
async function start() {
  console.log('Conectando ao banco de dados PostgreSQL...');
  await initDB();
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log('Rotas disponíveis:');
    console.log('  POST   /api/auth/login');
    console.log('  GET    /api/auth/perfil');
    console.log('  GET    /api/usuarios');
    console.log('  POST   /api/usuarios');
    console.log('  PUT    /api/usuarios/:id');
    console.log('  DELETE /api/usuarios/:id');
    console.log('  GET    /api/produtos');
    console.log('  POST   /api/produtos');
    console.log('  PUT    /api/produtos/:id');
    console.log('  DELETE /api/produtos/:id');
    console.log('  GET    /api/estoque');
    console.log('  GET    /api/estoque/baixo');
    console.log('  PUT    /api/estoque/:produto_id');
    console.log('  GET    /api/pedidos');
    console.log('  POST   /api/pedidos');
    console.log('  PUT    /api/pedidos/:id/status');
    console.log('  DELETE /api/pedidos/:id');
    console.log('Middleware de autenticação JWT ativo.');
    console.log(`Middleware de CORS configurado.`);
    console.log('Aguardando requisições...');
  });
}

start();