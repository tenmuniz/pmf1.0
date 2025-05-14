// Script para verificar conexão com o Supabase
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://bgyqzowtebcsdujywfom.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXF6b3d0ZWJjc2R1anl3Zm9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzEwMzg2MSwiZXhwIjoyMDYyNjc5ODYxfQ.3f0dM9QTiCo2MY3yX8MbPLL5hjbhtGSoJwo6kejNyII';

console.log('Inicializando cliente Supabase com:');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey.substring(0, 10) + '...[redacted]');

// Cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarConexao() {
  try {
    console.log('Tentando obter informações do usuário autenticado...');
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Erro ao obter usuário:', userError);
      return;
    }
    
    console.log('Dados do usuário obtidos:', userData ? 'sim' : 'não');
    
    console.log('Verificando se a tabela militares existe...');
    const { data: militaresData, error: militaresError } = await supabase
      .from('militares')
      .select('count');
    
    if (militaresError) {
      console.error('Erro ao verificar tabela militares:', militaresError);
      console.log('Code:', militaresError.code);
      console.log('Message:', militaresError.message);
      console.log('Details:', militaresError.details);
      
      if (militaresError.code === '42P01') {
        console.log('A tabela militares não existe. Isso é esperado se você ainda não criou as tabelas.');
      }
    } else {
      console.log('Tabela militares existe e contém registros:', militaresData);
    }
  } catch (error) {
    console.error('Erro ao verificar conexão:', error);
  }
}

// Executar a verificação
verificarConexao()
  .then(() => {
    console.log('Verificação concluída!');
  })
  .catch(error => {
    console.error('Erro fatal:', error);
  }); 