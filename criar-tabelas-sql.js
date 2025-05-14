// Script para criar tabelas no Supabase via API REST
require('dotenv').config();
const fetch = require('node-fetch');

// Configuração do Supabase
const supabaseUrl = 'https://bgyqzowtebcsdujywfom.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXF6b3d0ZWJjc2R1anl3Zm9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzEwMzg2MSwiZXhwIjoyMDYyNjc5ODYxfQ.3f0dM9QTiCo2MY3yX8MbPLL5hjbhtGSoJwo6kejNyII';

// SQL para criar as tabelas
const sqlCriarTabelas = [
  // Tabela militares
  `CREATE TABLE IF NOT EXISTS militares (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    posto TEXT NOT NULL,
    numero_identificacao TEXT NOT NULL UNIQUE,
    unidade TEXT,
    status TEXT DEFAULT 'ativo',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  
  // Tabela escalas
  `CREATE TABLE IF NOT EXISTS escalas (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    tipo TEXT NOT NULL,
    status TEXT DEFAULT 'ativa',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  
  // Tabela detalhes_escala
  `CREATE TABLE IF NOT EXISTS detalhes_escala (
    id SERIAL PRIMARY KEY,
    escala_id INTEGER REFERENCES escalas(id) ON DELETE CASCADE,
    militar_id INTEGER REFERENCES militares(id) ON DELETE CASCADE,
    data_servico DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    funcao TEXT,
    observacoes TEXT,
    UNIQUE(escala_id, militar_id, data_servico)
  );`
];

// Função para executar SQL no Supabase
async function executarSQL(sql) {
  console.log(`Executando SQL: ${sql.substring(0, 50)}...`);
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro (${response.status}): ${errorText}`);
      return false;
    }
    
    const result = await response.json();
    console.log(`SQL executado com sucesso!`);
    return true;
  } catch (error) {
    console.error(`Erro ao executar SQL:`, error);
    return false;
  }
}

// Função para criar todas as tabelas
async function criarTabelas() {
  console.log('Iniciando criação de tabelas no Supabase...');
  
  for (let i = 0; i < sqlCriarTabelas.length; i++) {
    console.log(`\nCriando tabela ${i + 1} de ${sqlCriarTabelas.length}...`);
    const sucesso = await executarSQL(sqlCriarTabelas[i]);
    
    if (!sucesso) {
      console.log(`Falha ao criar tabela ${i + 1}. Continuando com as próximas...`);
    }
  }
  
  console.log('\nProcesso de criação de tabelas concluído!');
}

// Função para inserir dados de teste
async function inserirDadosTeste() {
  console.log('\nInserindo dados de teste...');
  
  // Inserir militar de teste
  const sqlInserirMilitar = `
    INSERT INTO militares (nome, posto, numero_identificacao, unidade, status)
    VALUES ('Policial Teste', 'Soldado', '12345', 'PMF', 'ativo')
    ON CONFLICT (numero_identificacao) DO NOTHING
    RETURNING id;
  `;
  
  const militarResult = await executarSQL(sqlInserirMilitar);
  
  // Inserir escala de teste
  const sqlInserirEscala = `
    INSERT INTO escalas (titulo, data_inicio, data_fim, tipo, status)
    VALUES ('Escala de Teste', '2025-05-01', '2025-05-31', 'ordinaria', 'ativa')
    RETURNING id;
  `;
  
  const escalaResult = await executarSQL(sqlInserirEscala);
  
  // Inserir detalhe de escala
  const sqlInserirDetalhe = `
    INSERT INTO detalhes_escala (escala_id, militar_id, data_servico, horario_inicio, horario_fim, funcao, observacoes)
    SELECT 
      (SELECT id FROM escalas ORDER BY id DESC LIMIT 1),
      (SELECT id FROM militares ORDER BY id DESC LIMIT 1),
      '2025-05-15',
      '08:00',
      '18:00',
      'Patrulhamento',
      'Registro de teste'
    WHERE EXISTS (SELECT 1 FROM escalas) AND EXISTS (SELECT 1 FROM militares)
    ON CONFLICT DO NOTHING;
  `;
  
  await executarSQL(sqlInserirDetalhe);
  
  console.log('Inserção de dados de teste concluída!');
}

// Função para verificar se as tabelas foram criadas
async function verificarTabelas() {
  console.log('\nVerificando se as tabelas foram criadas...');
  
  const tabelas = ['militares', 'escalas', 'detalhes_escala'];
  const resultados = [];
  
  for (const tabela of tabelas) {
    const sql = `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '${tabela}') as exists;`;
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'params=single-object'
        },
        body: JSON.stringify({ query: sql })
      });
      
      if (!response.ok) {
        console.error(`Erro ao verificar tabela ${tabela}`);
        resultados.push({ tabela, existe: false });
        continue;
      }
      
      const result = await response.json();
      const existe = result?.[0]?.exists || false;
      
      console.log(`Tabela ${tabela}: ${existe ? 'EXISTE' : 'NÃO EXISTE'}`);
      resultados.push({ tabela, existe });
      
    } catch (error) {
      console.error(`Erro ao verificar tabela ${tabela}:`, error);
      resultados.push({ tabela, existe: false });
    }
  }
  
  const todasExistem = resultados.every(r => r.existe);
  console.log(`\nResultado: ${todasExistem ? 'Todas as tabelas foram criadas com sucesso!' : 'Algumas tabelas não foram criadas.'}`);
  
  return todasExistem;
}

// Executar o script
async function main() {
  try {
    // Criar as tabelas
    await criarTabelas();
    
    // Verificar se as tabelas foram criadas
    const todasExistem = await verificarTabelas();
    
    // Se todas as tabelas existirem, inserir dados de teste
    if (todasExistem) {
      await inserirDadosTeste();
    }
    
    console.log('\nScript executado com sucesso!');
    return todasExistem;
  } catch (error) {
    console.error('Erro durante a execução do script:', error);
    return false;
  }
}

// Executar o programa principal
main()
  .then(result => {
    console.log(`\nCriação de tabelas ${result ? 'completada com sucesso' : 'com problemas'}.`);
    process.exit(result ? 0 : 1);
  })
  .catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  }); 