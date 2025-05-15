const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Importa os módulos de banco de dados
const db = require('./db');
const { inicializarBancoDados } = require('./models');
const { inicializarSupabase } = require('./init-supabase'); // Importando o inicializador do Supabase
const { processarRequisicaoAPI } = require('./api');

// Porta padrão
const PORT = process.env.PORT || 8080;

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
    // Teste com queries diretas
    const result = await db.query('SELECT NOW() as now');
    console.log('Teste de conexão com o banco:', result.rows[0]);
    
    // Teste com Supabase
    const { supabase } = require('./supabase');
    const { data, error } = await supabase.from('pg_catalog.pg_tables').select('*').limit(1);
    
    if (error) {
      console.error('Erro no teste de conexão com Supabase:', error);
      return false;
    }
    
    console.log('Teste de conexão com Supabase bem-sucedido');
    return true;
  } catch (error) {
    console.error('Erro no teste de conexão com o banco:', error);
    return false;
  }
}

// Criar o servidor HTTP
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

// Função principal para inicializar o servidor
function init(bancoDadosOK = false, supabaseOK = false) {
  // Inicia o servidor na porta especificada
  server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
    console.log(`Status do banco de dados: ${bancoDadosOK ? 'Conectado' : 'Com problemas'}`);
    console.log(`Status do Supabase: ${supabaseOK ? 'Configurado' : 'Com problemas'}`);
  });
  
  return server;
}

// Se este arquivo for executado diretamente, inicializa o servidor
if (require.main === module) {
  (async function() {
    try {
      console.log('Iniciando servidor diretamente...');
      
      // Testar conexão com o banco
      const conexaoOK = await testarConexaoDB();
      if (!conexaoOK) {
        console.error('AVISO: Problemas com a conexão ao banco de dados!');
        console.error('Verificando problema em detalhes...');
        
        try {
          // Verificar se o problema é com as variáveis de ambiente
          console.log('Verificando variáveis de ambiente:');
          console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? 'Configurado' : 'Não configurado');
          console.log('- SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'Configurado' : 'Não configurado (comprimento da chave)');
          console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Configurado' : 'Não configurado (comprimento da chave)');
          console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'Configurado' : 'Não configurado');
          
          // Tentar usar valores padrão se não estiverem configurados
          console.log('Tentando usar valores padrão do arquivo supabase.js...');
          const { supabaseUrl, serviceRoleKey } = require('./supabase');
          console.log('URL do Supabase (fallback):', supabaseUrl);
          console.log('Chave de serviço (fallback):', serviceRoleKey ? 'Disponível' : 'Não disponível');
          
        } catch (detailError) {
          console.error('Erro ao verificar detalhes da conexão:', detailError);
        }
        
        console.error('Verifique suas credenciais no arquivo .env ou se o banco está acessível.');
      }
      
      // Inicializar banco de dados Supabase
      console.log('Inicializando banco de dados Supabase...');
      const supabaseOK = await inicializarSupabase();
      if (!supabaseOK) {
        console.error('AVISO: Falha ao inicializar o banco de dados Supabase!');
        console.error('Tentando método alternativo...');
      } else {
        console.log('Banco de dados Supabase inicializado com sucesso!');
      }
      
      // Inicializar banco de dados
      const bancoDadosOK = await inicializarBancoDados();
      if (!bancoDadosOK) {
        console.error('AVISO: Falha ao inicializar o banco de dados!');
        console.error('O sistema pode não funcionar corretamente.');
        
        // Forçar criação de tabelas como último recurso
        console.log('Tentando forçar criação das tabelas como último recurso...');
        try {
          const { militarModel, escalaModel } = require('./models');
          await militarModel.criarTabelaMilitares();
          await escalaModel.criarTabelaEscalas();
          await escalaModel.criarTabelaDetalhesEscala();
          console.log('Tentativa de criação forçada de tabelas concluída.');
        } catch (forceError) {
          console.error('Erro ao forçar criação de tabelas:', forceError);
        }
      }
      
      // Iniciar o servidor mesmo com problemas
      console.log('Iniciando servidor HTTP...');
      init(bancoDadosOK || supabaseOK, supabaseOK);
    } catch (error) {
      console.error('Erro crítico ao inicializar o servidor:', error);
    }
  })();
}

// Exportar o módulo
module.exports = {
  init,
  server
};