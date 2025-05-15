const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// URLs e chaves do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://bgyqzowtebcsdujywfom.supabase.co';

// Utiliza a chave de serviço para operações de banco de dados
// Esta chave permite operações completas no banco de dados
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXF6b3d0ZWJjc2R1anl3Zm9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzEwMzg2MSwiZXhwIjoyMDYyNjc5ODYxfQ.3f0dM9QTiCo2MY3yX8MbPLL5hjbhtGSoJwo6kejNyII';

// Chave anônima para operações do cliente
// Esta chave tem permissões mais restritas, adequada para uso pelo frontend
const anonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXF6b3d0ZWJjc2R1anl3Zm9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDM4NjEsImV4cCI6MjA2MjY3OTg2MX0.Nn1jL9DcUEn5ynB0vjvcxfm1jdJX9od8MVHow0iv7DQ';

console.log('Cliente Supabase inicializado com sucesso!');

// Configuração especial para suporte a função RPC
const options = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    fetch: global.fetch
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
};

// Criar o cliente Supabase com a chave de serviço para acesso completo ao banco
const supabase = createClient(supabaseUrl, serviceRoleKey, options);

// Criar um cliente Supabase com a chave anônima para uso pelo frontend
const supabasePublic = createClient(supabaseUrl, anonKey, options);

// Adicionar uma função RPC personalizada para executar consultas SQL
const pg_catalog_query = async (queryText) => {
  try {
    const { data, error } = await supabase.rpc('pg_catalog_query', {
      query_text: queryText
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Adicionar uma função para executar SQL direto (para administradores)
const executeSql = async (sqlQuery) => {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlQuery
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao executar SQL:', error);
    
    // Se o erro é que a função não existe, vamos tentar registrá-la
    if (error.message && error.message.includes('function') && error.message.includes('does not exist')) {
      try {
        console.log('Tentando criar função exec_sql...');
        
        // SQL para criar a função exec_sql (requer privilégios de admin)
        const createFunctionSql = `
          CREATE OR REPLACE FUNCTION exec_sql(sql text)
          RETURNS JSONB
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            result JSONB;
          BEGIN
            EXECUTE sql;
            result := '{"success": true}'::JSONB;
            RETURN result;
          EXCEPTION WHEN OTHERS THEN
            result := jsonb_build_object(
              'success', false,
              'error', SQLERRM,
              'code', SQLSTATE
            );
            RETURN result;
          END;
          $$;
        `;
        
        // Tentar criar a função via cliente HTTP
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          },
          body: JSON.stringify({ sql: createFunctionSql })
        });
        
        if (!response.ok) {
          throw new Error(`Falha ao criar função exec_sql: ${response.statusText}`);
        }
        
        return { data: { message: 'Função exec_sql criada com sucesso' }, error: null };
      } catch (funcError) {
        console.error('Erro ao criar função exec_sql:', funcError);
        return { data: null, error: funcError };
      }
    }
    
    return { data: null, error };
  }
};

// Exporta o cliente Supabase e funções relacionadas
module.exports = {
  supabase,
  supabasePublic,
  supabaseUrl,
  serviceRoleKey,
  anonKey,
  pg_catalog_query,
  executeSql
}; 