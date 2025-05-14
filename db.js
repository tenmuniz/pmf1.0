const { Pool } = require('pg');
require('dotenv').config();

// Usar a string de conexão da variável de ambiente
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_hKTcpGVsFJ40@ep-long-mouse-a46vfeji-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';

console.log('Tentando conectar ao banco de dados...');

// Configuração da conexão com o banco de dados Neon (PostgreSQL)
const pool = new Pool({
  connectionString: connectionString,
  ssl: true,
  statement_timeout: 10000, // timeout de 10 segundos para statements
  max: 5, // máximo de conexões no pool
  idleTimeoutMillis: 30000, // tempo máximo que uma conexão pode ficar inativa antes de ser fechada
  connectionTimeoutMillis: 10000 // tempo máximo para estabelecer uma conexão
});

// Evento para quando uma conexão é estabelecida
pool.on('connect', () => {
  console.log('Nova conexão estabelecida com o banco de dados');
  
  // Verificar conexão com consulta simples
  pool.query('SELECT 1 AS connection_test')
    .then(res => console.log('Conexão verificada com teste simples:', res.rows[0]))
    .catch(err => console.error('Falha na verificação da conexão:', err.message));
});

// Evento para quando há um erro em uma conexão
pool.on('error', (err) => {
  console.error('Erro na conexão do pool PostgreSQL:', err.message);
  // Não encerre o processo, apenas registre o erro
});

// Crie uma consulta para verificar se as transações funcionam
const testTransactionFunc = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    await client.query('SELECT 1 AS tx_test');
    console.log('Transação de teste iniciada com sucesso');
    await client.query('COMMIT');
    console.log('Transação de teste finalizada com sucesso');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Erro na transação de teste:', e.message);
  } finally {
    client.release();
  }
};

// Teste de conexão
pool.connect((err, client, release) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
    console.error('Detalhes do erro:', JSON.stringify(err));
    return;
  }
  console.log('Conexão com o banco de dados Neon estabelecida com sucesso!');
  
  // Testar consulta simples
  client.query('SELECT NOW() as now', (err, result) => {
    release();
    if (err) {
      console.error('Erro ao executar consulta de teste:', err.message);
      return;
    }
    console.log('Consulta de teste executada com sucesso:', result.rows[0]);
    
    // Agora teste uma transação
    testTransactionFunc();
  });
});

// Função para executar consultas SQL
async function query(text, params) {
  const start = Date.now();
  let client;
  
  try {
    client = await pool.connect();
    console.log('Executando consulta:', { text, params });
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    console.log('Consulta executada com sucesso:', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('Erro ao executar consulta:', { text, params, duration, error: error.message });
    console.error('Stack trace do erro:', error.stack);
    throw error;
  } finally {
    if (client) {
      client.release();
      console.log('Cliente liberado após consulta');
    }
  }
}

// Exporta as funções e objetos necessários
module.exports = {
  query,
  pool
};