// Script para inicializar as tabelas no Supabase
const { supabase, serviceRoleKey } = require('./supabase');
const { queryFallback } = require('./db');
const fetch = require('node-fetch');

async function initSupabaseTables() {
  console.log('Iniciando criação das tabelas no Supabase...');

  try {
    // Verificar primeiro se as tabelas já existem
    const { data: tabelas, error: tabelasError } = await supabase
      .from('militares')
      .select('count');
    
    if (!tabelasError) {
      console.log('Conexão com Supabase verificada, tabela militares já existe');
      return true;
    }
    
    // Se a tabela não existe, vamos criar
    console.log('A tabela militares não existe. Tentando criar...');
    
    // Definir as tabelas a serem criadas
    const createTableSQL = {
      militares: `
        CREATE TABLE IF NOT EXISTS militares (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(100) NOT NULL, 
          posto VARCHAR(50) NOT NULL,
          numero_identificacao VARCHAR(20) UNIQUE NOT NULL,
          unidade VARCHAR(50),
          status VARCHAR(20) DEFAULT 'ativo',
          data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
      escalas: `
        CREATE TABLE IF NOT EXISTS escalas (
          id SERIAL PRIMARY KEY,
          titulo VARCHAR(100) NOT NULL,
          data_inicio DATE NOT NULL,
          data_fim DATE NOT NULL,
          tipo VARCHAR(50) NOT NULL,
          status VARCHAR(20) DEFAULT 'ativa',
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
          funcao VARCHAR(50),
          observacoes TEXT,
          UNIQUE(escala_id, militar_id, data_servico)
        )
      `
    };
    
    // Utilizar o endpoint SQL do Supabase para cada tabela
    // Endpoint: REST API direta (necessita service_role key)
    const supabaseRestUrl = 'https://bgyqzowtebcsdujywfom.supabase.co/rest/v1/';
    
    try {
      // Criar tabela militares
      console.log('Criando tabela militares...');
      await executeSqlQuery(createTableSQL.militares);
      
      // Criar tabela escalas
      console.log('Criando tabela escalas...');
      await executeSqlQuery(createTableSQL.escalas);
      
      // Criar tabela detalhes_escala
      console.log('Criando tabela detalhes_escala...');
      await executeSqlQuery(createTableSQL.detalhes_escala);
      
    } catch (sqlError) {
      console.error('Erro na execução do SQL:', sqlError);
      return false;
    }
    
    // Verificar se as tabelas foram criadas
    try {
      // Lista de tabelas esperadas
      const tablesExpected = ['militares', 'escalas', 'detalhes_escala'];
      const tablesFound = [];
      
      for (const tableName of tablesExpected) {
        try {
          const { data, error } = await supabase.from(tableName).select('count');
          if (!error) {
            tablesFound.push(tableName);
            console.log(`Tabela '${tableName}' encontrada!`);
          }
        } catch (err) {
          console.error(`Erro ao verificar tabela ${tableName}:`, err);
        }
      }
      
      if (tablesFound.length === tablesExpected.length) {
        console.log('Todas as tabelas foram criadas com sucesso!');
        return true;
      } else {
        console.log(`Apenas ${tablesFound.length} de ${tablesExpected.length} tabelas foram encontradas.`);
        return tablesFound.length > 0; // Retorna true se ao menos uma tabela foi criada
      }
    } catch (verifyError) {
      console.error('Erro ao verificar as tabelas:', verifyError);
      return false;
    }
  } catch (error) {
    console.error('Erro ao inicializar tabelas no Supabase:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Função auxiliar para executar SQL via PostgreSQL
async function executeSqlQuery(sql) {
  try {
    // Tenta usar a API REST do Supabase com o endpoint SQL
    const response = await fetch('https://bgyqzowtebcsdujywfom.supabase.co/rest/v1/rpc/execute_sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        sql_query: sql
      })
    });
    
    // Verificar resposta
    if (!response.ok) {
      if (response.status === 404) {
        console.error('API execute_sql não encontrada. Tentando outro método...');
        // Se a função RPC não existir, tenta fazer via PostgreSQL direto
        return await queryFallback(sql);
      }
      
      const errorText = await response.text();
      throw new Error(`Erro na API SQL (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao executar SQL:', error);
    // Tenta via PostgreSQL direto como fallback
    try {
      return await queryFallback(sql);
    } catch (pgError) {
      console.error('Erro também no fallback PostgreSQL:', pgError);
      throw pgError;
    }
  }
}

// Executar a inicialização
initSupabaseTables()
  .then((result) => {
    console.log(`Inicialização do Supabase ${result ? 'concluída com sucesso' : 'falhou'}`);
    process.exit(result ? 0 : 1);
  })
  .catch((error) => {
    console.error('Erro não tratado durante inicialização:', error);
    process.exit(1);
  }); 