const { createClient } = require('@supabase/supabase-js');

// URLs e chaves do Supabase
console.log('Usando Supabase:');
console.log('URL: https://bgyqzowtebcsdujywfom.supabase.co');

// Chave de serviço
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXF6b3d0ZWJjc2R1anl3Zm9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzEwMzg2MSwiZXhwIjoyMDYyNjc5ODYxfQ.3f0dM9QTiCo2MY3yX8MbPLL5hjbhtGSoJwo6kejNyII';

// Cria o cliente Supabase
const supabase = createClient('https://bgyqzowtebcsdujywfom.supabase.co', serviceKey);

async function testarCriacaoTabela() {
  try {
    console.log('\n--- Testando criação de tabela ---');
    
    // Tentando criar a tabela militares via API
    console.log('Tentando criar tabela militares...');
    
    try {
      // No Supabase, usamos o endpoint /rest/v1/rpc/execute_sql para executar SQL raw
      console.log('Verificando se é possível usar SQL direto...');
      
      const { data, error } = await supabase.rpc('execute_sql', { 
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
      const { data, error } = await supabase
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
testarCriacaoTabela().then(() => {
  console.log('\nTeste concluído!');
}).catch(error => {
  console.error('Erro fatal:', error);
}); 