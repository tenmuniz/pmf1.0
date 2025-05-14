const { createClient } = require('@supabase/supabase-js');

// URLs e chaves do Supabase
console.log('Usando Supabase:');
console.log('URL: https://bgyqzowtebcsdujywfom.supabase.co');
console.log('Key: (service_role fornecida)');

// Chave anônima para teste
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXF6b3d0ZWJjc2R1anl3Zm9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDM4NjEsImV4cCI6MjA2MjY3OTg2MX0.Nn1jL9DcUEn5ynB0vjvcxfm1jdJX9od8MVHow0iv7DQ';

// Chave de serviço
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXF6b3d0ZWJjc2R1anl3Zm9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzEwMzg2MSwiZXhwIjoyMDYyNjc5ODYxfQ.3f0dM9QTiCo2MY3yX8MbPLL5hjbhtGSoJwo6kejNyII';

// Cria os clientes Supabase para testar ambas as chaves
const supabaseAnon = createClient('https://bgyqzowtebcsdujywfom.supabase.co', anonKey);
const supabaseService = createClient('https://bgyqzowtebcsdujywfom.supabase.co', serviceKey);

async function testarConexao() {
  try {
    console.log('\n--- Testando conexão com chave anônima ---');
    
    // Tentar pegar a versão
    const { data: userInfo, error: userError } = await supabaseAnon.auth.getUser();
    console.log('Informações do usuário anônimo:', userInfo ? 'obtido' : 'não obtido');
    if (userError) console.error('Erro ao obter usuário anônimo:', userError);
    
    console.log('\n--- Testando conexão com chave de serviço ---');
    
    // Tentar pegar a versão
    const { data: serviceInfo, error: serviceError } = await supabaseService.auth.getUser();
    console.log('Informações do usuário service_role:', serviceInfo ? 'obtido' : 'não obtido');
    if (serviceError) console.error('Erro ao obter usuário service_role:', serviceError);
    
    // Tentar listar schemas
    try {
      console.log('\n--- Tentando listar schemas ---');
      const { data, error } = await supabaseService.rpc('list_schemas');
      if (error) {
        console.error('Erro ao listar schemas:', error);
      } else {
        console.log('Schemas disponíveis:', data);
      }
    } catch (e) {
      console.log('Função RPC não disponível:', e.message);
    }
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

async function testarCriacaoTabela() {
  try {
    console.log('\n--- Testando criação de tabela ---');
    
    // Tentando criar a tabela militares via API
    console.log('Tentando criar tabela militares...');
    
    try {
      // No Supabase, usamos o endpoint /rest/v1/rpc/execute_sql para executar SQL raw
      console.log('Verificando se é possível usar SQL direto...');
      
      const { data, error } = await supabaseService.rpc('execute_sql', { 
        sql_query: `
          CREATE TABLE IF NOT EXISTS militares (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(100) NOT NULL,
            posto VARCHAR(50) NOT NULL,
            numero_identificacao VARCHAR(20) UNIQUE NOT NULL,
            unidade VARCHAR(50),
            status VARCHAR(20) DEFAULT 'ativo',
            data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      });
      
      if (error) {
        console.error('Erro ao executar SQL via RPC:', error);
      } else {
        console.log('Tabela criada com sucesso via RPC');
      }
      
    } catch (sqlError) {
      console.error('Erro ao usar SQL direto:', sqlError);
    }
    
    // Tentar criar via SQL pelo driver Postgres
    console.log('\n--- Tentando inserir um registro ---');
    
    try {
      const { data, error } = await supabaseService
        .from('militares')
        .insert({
          nome: 'Teste Via API',
          posto: 'Soldado',
          numero_identificacao: '123456',
          unidade: 'PMF',
          status: 'ativo'
        })
        .select();
      
      if (error) {
        console.error('Erro ao inserir registro:', error);
      } else {
        console.log('Registro inserido com sucesso:', data);
      }
    } catch (insertError) {
      console.error('Erro ao tentar inserir:', insertError);
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

// Executar
testarConexao().then(() => {
  console.log('\nTeste concluído!');
  testarCriacaoTabela().then(() => {
    console.log('\nTeste de criação de tabela concluído!');
  }).catch(error => {
    console.error('Erro fatal:', error);
  });
}).catch(error => {
  console.error('Erro fatal:', error);
}); 