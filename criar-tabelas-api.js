const { createClient } = require('@supabase/supabase-js');
// Para Node.js v18 ou superior, o fetch já está disponível globalmente
// Para versões anteriores, precisamos importar de forma diferente
let fetch;
try {
  fetch = global.fetch;
} catch (e) {
  // Se fetch não estiver disponível globalmente, tente importar
  fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
}

// Configuração do Supabase
const supabaseUrl = 'https://bgyqzowtebcsdujywfom.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXF6b3d0ZWJjc2R1anl3Zm9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzEwMzg2MSwiZXhwIjoyMDYyNjc5ODYxfQ.3f0dM9QTiCo2MY3yX8MbPLL5hjbhtGSoJwo6kejNyII';

// Cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Definição das tabelas em formato SQL
const tablesSQL = {
  militares: `
    CREATE TABLE IF NOT EXISTS militares (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      posto TEXT NOT NULL,
      numero_identificacao TEXT NOT NULL UNIQUE,
      unidade TEXT,
      status TEXT DEFAULT 'ativo',
      data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  escalas: `
    CREATE TABLE IF NOT EXISTS escalas (
      id SERIAL PRIMARY KEY,
      titulo TEXT NOT NULL,
      data_inicio DATE NOT NULL,
      data_fim DATE NOT NULL,
      tipo TEXT NOT NULL,
      status TEXT DEFAULT 'ativa',
      data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  detalhes_escala: `
    CREATE TABLE IF NOT EXISTS detalhes_escala (
      id SERIAL PRIMARY KEY,
      escala_id INTEGER REFERENCES escalas(id) ON DELETE CASCADE,
      militar_id INTEGER REFERENCES militares(id) ON DELETE CASCADE,
      data_servico DATE NOT NULL,
      horario_inicio TIME NOT NULL,
      horario_fim TIME NOT NULL,
      funcao TEXT,
      observacoes TEXT,
      UNIQUE(escala_id, militar_id, data_servico)
    )
  `
};

// Função para testar e criar tabela 
async function createTable(tableName) {
  console.log(`\nVerificando tabela ${tableName}...`);
  
  try {
    // Verifica se a tabela já existe
    const { error: checkError } = await supabase.from(tableName).select('count');
    
    if (!checkError) {
      console.log(`Tabela ${tableName} já existe.`);
      return true;
    }
    
    console.log(`Tabela ${tableName} não existe. Tentando criar...`);
    console.log(`SQL: ${tablesSQL[tableName]}`);
    
    // Como não podemos executar SQL direto, vamos usar o cliente para criar os registros
    if (tableName === 'militares') {
      // Criar a tabela usando uma API específica para cada tabela
      const { error } = await supabase.from('militares').insert({
        nome: 'Teste Inicial',
        posto: 'Soldado',
        numero_identificacao: '123456',
        unidade: 'PMF',
        status: 'ativo'
      });
      
      if (error && error.code === '42P01') {
        console.log('Erro esperado: tabela não existe');
        console.log('Supabase não permite criar tabelas via API. As tabelas devem ser criadas manualmente no painel do Supabase.');
        console.log('Por favor, crie as tabelas manualmente no painel de controle do Supabase.');
        return false;
      } else if (error) {
        console.error(`Erro ao verificar tabela ${tableName}:`, error);
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Erro ao verificar/criar tabela ${tableName}:`, error);
    return false;
  }
}

// Função para testar a inserção de dados
async function insertTestData() {
  try {
    // Inserir um militar de teste
    const { data: militar, error: militarError } = await supabase
      .from('militares')
      .insert({
        nome: 'Teste Supabase',
        posto: 'Soldado',
        numero_identificacao: '123456',
        unidade: 'PMF',
        status: 'ativo'
      })
      .select();
    
    if (militarError) {
      console.error('Erro ao inserir militar de teste:', militarError);
    } else {
      console.log('Militar de teste inserido:', militar);
      
      // Inserir uma escala de teste
      const { data: escala, error: escalaError } = await supabase
        .from('escalas')
        .insert({
          titulo: 'Escala de Teste',
          data_inicio: '2023-05-01',
          data_fim: '2023-05-31',
          tipo: 'ordinaria',
          status: 'ativa'
        })
        .select();
      
      if (escalaError) {
        console.error('Erro ao inserir escala de teste:', escalaError);
      } else {
        console.log('Escala de teste inserida:', escala);
        
        // Inserir um detalhe de escala
        const { data: detalhe, error: detalheError } = await supabase
          .from('detalhes_escala')
          .insert({
            escala_id: escala[0].id,
            militar_id: militar[0].id,
            data_servico: '2023-05-15',
            horario_inicio: '08:00',
            horario_fim: '18:00',
            funcao: 'Patrulhamento',
            observacoes: 'Teste via API'
          })
          .select();
        
        if (detalheError) {
          console.error('Erro ao inserir detalhe de escala:', detalheError);
        } else {
          console.log('Detalhe de escala inserido:', detalhe);
        }
      }
    }
  } catch (error) {
    console.error('Erro ao inserir dados de teste:', error);
  }
}

// Função principal
async function main() {
  try {
    console.log('Verificando conexão com o Supabase...');
    
    // Testar a conexão
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Erro ao conectar com o Supabase:', userError);
      return false;
    }
    
    console.log('Conexão com o Supabase estabelecida com sucesso!');
    
    // Verificar tabelas
    const tableNames = Object.keys(tablesSQL);
    const results = [];
    
    for (const tableName of tableNames) {
      const result = await createTable(tableName);
      results.push({ table: tableName, success: result });
    }
    
    console.log('\nResumo da verificação de tabelas:');
    results.forEach(r => {
      console.log(`- ${r.table}: ${r.success ? 'Existe' : 'Não existe - precisa ser criada manualmente'}`);
    });
    
    const allTablesExist = results.every(r => r.success);
    
    if (allTablesExist) {
      console.log('\nTodas as tabelas existem!');
      
      // Inserir dados de teste
      console.log('\nInserindo dados de teste...');
      await insertTestData();
      
      return true;
    } else {
      console.log('\nAlgumas tabelas não existem e precisam ser criadas manualmente.');
      console.log('\nInstruções para criar tabelas no Supabase:');
      console.log('1. Acesse https://app.supabase.io/');
      console.log('2. Vá para seu projeto');
      console.log('3. Clique em "Table Editor" no menu lateral');
      console.log('4. Clique em "New table"');
      console.log('5. Crie cada tabela com a estrutura especificada acima');
      
      // Exibir novamente os SQLs para facilitar a criação manual
      console.log('\nSQLs para criar as tabelas:');
      for (const [tableName, sql] of Object.entries(tablesSQL)) {
        console.log(`\n--- ${tableName} ---`);
        console.log(sql);
      }
      
      return false;
    }
  } catch (error) {
    console.error('Erro durante a execução:', error);
    return false;
  }
}

// Executar
main()
  .then(result => {
    console.log(`\nScript finalizado com ${result ? 'sucesso' : 'instruções para criação manual'}.`);
    process.exit(result ? 0 : 1);
  })
  .catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  }); 