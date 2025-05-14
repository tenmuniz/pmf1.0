const { Pool } = require('pg');
const { supabase } = require('./supabase');
require('dotenv').config();

// String de conexão para o PostgreSQL direto como fallback
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@db.bgyqzowtebcsdujywfom.supabase.co:5432/postgres';

console.log('Configurando conexões com o banco de dados...');

// Mantendo o pool do PostgreSQL para compatibilidade com código existente
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
  console.log('Nova conexão estabelecida com o banco de dados PostgreSQL');
});

// Evento para quando há um erro em uma conexão
pool.on('error', (err) => {
  console.error('Erro na conexão do pool PostgreSQL:', err.message);
  // Não encerre o processo, apenas registre o erro
});

// Função para executar consultas SQL
async function query(text, params) {
  const start = Date.now();
  
  try {
    console.log('Executando consulta:', { text, params });
    
    // Tenta executar a query diretamente no Supabase
    // Tratamento depende do tipo de consulta
    if (text.trim().toUpperCase().startsWith('SELECT')) {
      // Para SELECT, usamos o cliente Supabase
      let table = '';
      let conditions = [];
      
      // Tentativa simples de extrair a tabela e condições
      const fromMatch = text.match(/FROM\s+(\w+)/i);
      if (fromMatch && fromMatch[1]) {
        table = fromMatch[1];
        console.log(`Detectada tabela: ${table}`);
        
        // Para substituir a query SQL por chamadas de API do Supabase
        // Tenta extrair condições WHERE 
        const whereMatch = text.match(/WHERE\s+(.*?)(?:ORDER BY|GROUP BY|LIMIT|$)/i);
        if (whereMatch && whereMatch[1]) {
          conditions = whereMatch[1].trim();
          console.log(`Detectadas condições: ${conditions}`);
        }

        // Executar via API
        try {
          let query = supabase.from(table).select('*');
          
          // Limitar resultados 
          const limitMatch = text.match(/LIMIT\s+(\d+)/i);
          if (limitMatch && limitMatch[1]) {
            query = query.limit(parseInt(limitMatch[1]));
          }
          
          const { data, error } = await query;
          
          if (error) throw error;
          
          const duration = Date.now() - start;
          console.log('Consulta Supabase executada com sucesso:', { text, duration, rows: data.length });
          
          return { rows: data, rowCount: data.length };
        } catch (selectError) {
          console.error('Erro ao executar SELECT via Supabase API:', selectError);
          // Fallback para PostgreSQL
          return await queryFallback(text, params);
        }
      } else {
        // Query SQL não reconhecida para API
        return await queryFallback(text, params);
      }
    } else if (text.trim().toUpperCase().startsWith('INSERT')) {
      // Para INSERT, usamos o cliente Supabase
      const intoMatch = text.match(/INTO\s+(\w+)/i);
      if (intoMatch && intoMatch[1]) {
        const table = intoMatch[1];
        console.log(`Detectada tabela para inserção: ${table}`);
        
        if (params && params.length > 0) {
          try {
            // Converter parâmetros em objeto para inserção
            // Esta é uma estratégia genérica, pode precisar de adaptação
            const values = {};
            const columnsMatch = text.match(/\(([^)]+)\)/);
            if (columnsMatch && columnsMatch[1]) {
              const columns = columnsMatch[1].split(',').map(c => c.trim());
              for (let i = 0; i < columns.length; i++) {
                values[columns[i]] = params[i];
              }
            }
            
            const { data, error } = await supabase.from(table).insert(values).select();
            
            if (error) throw error;
            
            const duration = Date.now() - start;
            console.log('INSERT via Supabase executado com sucesso:', { table, duration });
            
            return { rows: data, rowCount: data.length };
          } catch (insertError) {
            console.error('Erro ao executar INSERT via Supabase API:', insertError);
            // Fallback para PostgreSQL
            return await queryFallback(text, params);
          }
        }
      }
      // Fallback para PostgreSQL se não conseguir usar a API
      return await queryFallback(text, params);
    } else {
      // Outros tipos de consulta SQL (UPDATE, DELETE, etc)
      // Usamos o PostgreSQL diretamente
      return await queryFallback(text, params);
    }
  } catch (error) {
    const duration = Date.now() - start;
    console.error('Erro geral na execução da consulta:', { text, params, duration, error: error.message });
    console.error('Stack trace do erro:', error.stack);
    
    // Tenta usar o fallback
    try {
      return await queryFallback(text, params);
    } catch (fallbackError) {
      console.error('Erro no fallback:', fallbackError.message);
      throw fallbackError;
    }
  }
}

// Função de fallback para usar o PostgreSQL direto
async function queryFallback(text, params) {
  const start = Date.now();
  let client;
  
  try {
    client = await pool.connect();
    console.log('Executando consulta via PostgreSQL direto:', { text, params });
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    console.log('Consulta PostgreSQL executada com sucesso:', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('Erro ao executar consulta PostgreSQL:', { text, params, duration, error: error.message });
    console.error('Stack trace do erro:', error.stack);
    throw error;
  } finally {
    if (client) {
      client.release();
      console.log('Cliente PostgreSQL liberado após consulta');
    }
  }
}

// Testar a conexão 
async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('militares').select('count');
    
    if (error && error.code === '42P01') {
      // A tabela não existe, mas a conexão está ok
      console.log('A tabela militares não existe, mas a conexão com o Supabase está funcionando');
      // Testar conexão básica
      const authResponse = await supabase.auth.getSession();
      console.log('Status da sessão Supabase:', authResponse.error ? 'Erro' : 'OK');
      return !authResponse.error;
    } else if (error) {
      console.error('Erro ao testar conexão com Supabase:', error.message);
      return false;
    }
    
    console.log('Conexão com Supabase testada com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao testar conexão com Supabase:', error.message);
    console.error('Stack trace do erro:', error.stack);
    return false;
  }
}

// Inicialização
(async () => {
  try {
    console.log('Testando conexão com Supabase...');
    const supabaseOk = await testSupabaseConnection();
    
    if (supabaseOk) {
      console.log('Sistema utilizará o Supabase como banco de dados principal');
    } else {
      console.log('Sistema utilizará PostgreSQL direto como fallback');
    }
  } catch (error) {
    console.error('Erro durante inicialização:', error);
  }
})();

// Exporta as funções e objetos necessários
module.exports = {
  query,
  queryFallback,
  pool,
  supabase
};