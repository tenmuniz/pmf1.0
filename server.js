const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Importa os módulos de banco de dados
const db = require('./db');
const { inicializarBancoDados } = require('./models');
const { processarRequisicaoAPI } = require('./api');

// Porta alterada de 3000 para 8080
const PORT = 8080;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Função para testar a conexão com o banco de dados
async function testarConexaoDB() {
  try {
    const result = await db.query('SELECT NOW() as now');
    console.log('Teste de conexão com o banco:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Erro no teste de conexão com o banco:', error);
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Verifica se é uma requisição de API
  try {
    const ehRequisicaoAPI = await processarRequisicaoAPI(req, res);
    
    // Se for uma requisição de API, ela já foi processada
    if (ehRequisicaoAPI) {
      console.log(`Requisição API processada: ${req.method} ${req.url}`);
      return;
    }
  } catch (error) {
    console.error(`Erro ao processar requisição API: ${req.method} ${req.url}`, error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ erro: 'Erro interno do servidor' }));
    return;
  }
  
  // Normaliza o caminho da URL para arquivos estáticos
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }
  
  // Obtém a extensão do arquivo
  const extname = path.extname(filePath);
  let contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  // Lê o arquivo
  fs.readFile(path.join(__dirname, filePath), (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Página não encontrada
        fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        // Algum erro de servidor
        res.writeHead(500);
        res.end(`Erro no servidor: ${err.code}`);
      }
    } else {
      // Sucesso
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Inicializa o banco de dados antes de iniciar o servidor
(async function() {
  try {
    console.log('Iniciando servidor...');
    
    // Testar conexão com o banco
    const conexaoOK = await testarConexaoDB();
    if (!conexaoOK) {
      console.error('AVISO: Problemas com a conexão ao banco de dados!');
      console.error('Verifique suas credenciais no arquivo .env ou se o banco está acessível.');
    }
    
    // Inicializar banco de dados
    const bancoDadosOK = await inicializarBancoDados();
    if (!bancoDadosOK) {
      console.error('AVISO: Falha ao inicializar o banco de dados!');
    }
    
    // Inicia o servidor mesmo com problemas no banco
    server.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`Acesse: http://localhost:${PORT}`);
      console.log(`Status do banco de dados: ${conexaoOK ? 'Conectado' : 'Com problemas'}`);
    });
  } catch (error) {
    console.error('Erro crítico ao inicializar o servidor:', error);
  }
})();