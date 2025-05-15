// Script para verificar a conexão com o banco de dados
const { supabase } = require('./supabase');
const db = require('./db');

async function verificarConexao() {
  console.log('=== VERIFICAÇÃO DE CONEXÃO ===');
  
  try {
    // Verificar conexão com o Supabase
    console.log('\nTestando conexão com o Supabase...');
    
    const { data, error } = await supabase.from('pg_catalog.pg_tables').select('*').limit(1);
    
    if (error) {
      console.error('❌ Erro ao conectar com o Supabase:', error.message);
    } else {
      console.log('✅ Conexão com o Supabase estabelecida com sucesso!');
      
      // Verificar tabelas
      console.log('\nVerificando tabelas no Supabase...');
      
      const tabelas = ['militares', 'escalas', 'detalhes_escala'];
      const tabelasExistentes = [];
      
      for (const tabela of tabelas) {
        try {
          const { data, error } = await supabase.from(tabela).select('count');
          
          if (!error) {
            tabelasExistentes.push(tabela);
            console.log(`✅ Tabela ${tabela} encontrada`);
          } else {
            console.log(`❌ Tabela ${tabela} não encontrada`);
          }
        } catch (err) {
          console.error(`❌ Erro ao verificar tabela ${tabela}:`, err.message);
        }
      }
      
      console.log(`\n${tabelasExistentes.length} de ${tabelas.length} tabelas encontradas`);
    }
    
    // Verificar conexão direta com PostgreSQL
    console.log('\nTestando conexão direta com PostgreSQL...');
    
    try {
      const result = await db.queryFallback('SELECT current_database() as database, current_user as user, version() as version');
      
      if (result && result.rows && result.rows.length > 0) {
        console.log('✅ Conexão direta com PostgreSQL estabelecida com sucesso!');
        console.log('📊 Dados da conexão:');
        console.log(`   Database: ${result.rows[0].database}`);
        console.log(`   Usuário: ${result.rows[0].user}`);
        console.log(`   Versão: ${result.rows[0].version}`);
      } else {
        console.error('❌ Falha ao obter informações do PostgreSQL');
      }
    } catch (pgError) {
      console.error('❌ Erro ao conectar diretamente com PostgreSQL:', pgError.message);
    }
    
  } catch (error) {
    console.error('Erro geral:', error.message);
    console.error('Stack trace:', error.stack);
  }
  
  console.log('\n=== FIM DA VERIFICAÇÃO ===');
}

// Executar a verificação
verificarConexao().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
}); 