// Script para verificar as tabelas no Supabase
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://bgyqzowtebcsdujywfom.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXF6b3d0ZWJjc2R1anl3Zm9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzEwMzg2MSwiZXhwIjoyMDYyNjc5ODYxfQ.3f0dM9QTiCo2MY3yX8MbPLL5hjbhtGSoJwo6kejNyII';

console.log('Inicializando cliente Supabase...');

// Cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Definição das tabelas que esperamos encontrar
const tabelasEsperadas = ['militares', 'escalas', 'detalhes_escala'];

// SQL para criar as tabelas, caso precise criar manualmente
const sqlCriarTabelas = {
  militares: `
    CREATE TABLE militares (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      posto TEXT NOT NULL,
      numero_identificacao TEXT NOT NULL UNIQUE,
      unidade TEXT,
      status TEXT DEFAULT 'ativo',
      data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  escalas: `
    CREATE TABLE escalas (
      id SERIAL PRIMARY KEY,
      titulo TEXT NOT NULL,
      data_inicio DATE NOT NULL,
      data_fim DATE NOT NULL,
      tipo TEXT NOT NULL,
      status TEXT DEFAULT 'ativa',
      data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  detalhes_escala: `
    CREATE TABLE detalhes_escala (
      id SERIAL PRIMARY KEY,
      escala_id INTEGER REFERENCES escalas(id) ON DELETE CASCADE,
      militar_id INTEGER REFERENCES militares(id) ON DELETE CASCADE,
      data_servico DATE NOT NULL,
      horario_inicio TIME NOT NULL,
      horario_fim TIME NOT NULL,
      funcao TEXT,
      observacoes TEXT,
      UNIQUE(escala_id, militar_id, data_servico)
    );
  `
};

async function verificarTabelas() {
  console.log('Verificando se as tabelas necessárias existem...');
  
  const resultados = [];
  
  for (const tabela of tabelasEsperadas) {
    try {
      console.log(`\nVerificando tabela ${tabela}...`);
      
      const { data, error } = await supabase
        .from(tabela)
        .select('count');
      
      if (error) {
        console.error(`Erro ao verificar tabela ${tabela}:`, error.message);
        console.log(`Código do erro: ${error.code}`);
        
        if (error.code === '42P01') {
          console.log(`A tabela "${tabela}" não existe no banco de dados.`);
          resultados.push({ tabela, existe: false });
        } else {
          console.log(`Erro desconhecido ao verificar tabela "${tabela}".`);
          resultados.push({ tabela, existe: false, erro: error });
        }
      } else {
        console.log(`A tabela "${tabela}" existe!`);
        console.log(`Quantidade de registros: ${data[0]?.count || 0}`);
        resultados.push({ tabela, existe: true, registros: data[0]?.count || 0 });
      }
    } catch (erro) {
      console.error(`Erro ao processar tabela ${tabela}:`, erro);
      resultados.push({ tabela, existe: false, erro });
    }
  }
  
  // Resumo
  console.log('\n--- Resumo da verificação ---');
  let todasExistem = true;
  
  for (const resultado of resultados) {
    console.log(`- ${resultado.tabela}: ${resultado.existe ? 'Existe' : 'Não existe'}`);
    if (!resultado.existe) {
      todasExistem = false;
    }
  }
  
  if (todasExistem) {
    console.log('\nTodas as tabelas necessárias existem. O sistema está pronto para ser usado!');
  } else {
    console.log('\nAlgumas tabelas estão faltando. Você precisa criá-las manualmente no painel do Supabase.');
    console.log('\nSQLs para criar as tabelas:');
    
    for (const tabela of tabelasEsperadas) {
      if (!resultados.find(r => r.tabela === tabela && r.existe)) {
        console.log(`\n--- SQL para criar a tabela ${tabela} ---`);
        console.log(sqlCriarTabelas[tabela]);
      }
    }
    
    console.log('\nInstruções para criar as tabelas:');
    console.log('1. Acesse o painel do Supabase: https://app.supabase.com');
    console.log('2. Selecione seu projeto');
    console.log('3. Vá para "Table Editor" no menu lateral');
    console.log('4. Clique em "SQL Editor"');
    console.log('5. Cole os SQLs acima e execute-os');
  }
}

// Executar
verificarTabelas()
  .then(() => {
    console.log('\nVerificação concluída!');
  })
  .catch(erro => {
    console.error('Erro fatal durante a verificação:', erro);
  }); 