// Arquivo app.js - ponto de entrada principal para o sistema
require('dotenv').config();
const { inicializarSupabase } = require('./init-supabase');
const { inicializarBancoDados } = require('./models');
const server = require('./server');
const db = require('./db');
const { supabase } = require('./supabase');

console.log('================================');
console.log('=      SISTEMA PMF 1.0         =');
console.log('================================');

// Função para inicializar o sistema completo
async function inicializarSistema() {
  console.log('Iniciando o Sistema PMF...');
  let supabaseOK = false;
  let bancoDadosOK = false;
  
  try {
    // 1. Verificar conexão com o Supabase
    console.log('\n[1/3] Verificando conexão com o Supabase...');
    try {
      const { data, error } = await supabase.from('pg_catalog.pg_tables').select('*').limit(1);
      
      if (error) {
        console.error('❌ Erro ao conectar com o Supabase:', error.message);
      } else {
        console.log('✅ Conexão com o Supabase estabelecida com sucesso!');
        supabaseOK = true;
      }
    } catch (error) {
      console.error('❌ Erro ao verificar conexão com o Supabase:', error.message);
    }
    
    // 2. Inicializar estrutura do banco de dados
    console.log('\n[2/3] Inicializando estrutura do banco de dados...');
    try {
      // Primeiro tenta com o inicializarSupabase (mais completo)
      const supabaseInitOK = await inicializarSupabase();
      
      if (supabaseInitOK) {
        console.log('✅ Banco de dados Supabase inicializado com sucesso!');
        bancoDadosOK = true;
      } else {
        // Se falhar, tenta com o inicializador padrão
        console.log('⚠️ Tentando método alternativo de inicialização...');
        const dbInitOK = await inicializarBancoDados();
        
        if (dbInitOK) {
          console.log('✅ Banco de dados inicializado com método alternativo!');
          bancoDadosOK = true;
        } else {
          console.error('❌ Falha ao inicializar banco de dados!');
        }
      }
    } catch (error) {
      console.error('❌ Erro durante inicialização do banco de dados:', error.message);
    }
    
    // 3. Iniciar o servidor HTTP
    console.log('\n[3/3] Iniciando o servidor HTTP...');
    server.init(bancoDadosOK, supabaseOK);
    
    console.log('\n================================');
    console.log(`Supabase: ${supabaseOK ? '✅ OK' : '❌ Falha'}`);
    console.log(`Banco de dados: ${bancoDadosOK ? '✅ OK' : '❌ Falha'}`);
    console.log(`Servidor: ✅ Iniciado na porta ${process.env.PORT || 8080}`);
    console.log('================================');
    
    return {
      supabaseOK,
      bancoDadosOK,
      serverOK: true
    };
  } catch (error) {
    console.error('Erro crítico durante inicialização do sistema:', error.message);
    console.error('Stack trace:', error.stack);
    
    return {
      supabaseOK,
      bancoDadosOK,
      serverOK: false,
      error: error.message
    };
  }
}

// Iniciar o sistema
inicializarSistema()
  .then(status => {
    if (status.serverOK) {
      console.log(`\nAcesse o sistema em: http://localhost:${process.env.PORT || 8080}`);
    } else {
      console.error('\nO servidor não pôde ser iniciado devido a erros críticos.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Erro fatal durante inicialização:', error);
    process.exit(1);
  }); 