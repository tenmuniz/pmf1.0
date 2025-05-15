#!/usr/bin/env node
// Script de build executado pelo Vercel durante o deploy

console.log('===== SCRIPT DE BUILD DO VERCEL =====');
console.log('Data/Hora:', new Date().toISOString());
console.log('NODE_ENV:', process.env.NODE_ENV);

// Carregar variáveis de ambiente
require('dotenv').config();

// Verificar variáveis obrigatórias
const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'SUPABASE_ANON_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`❌ ERRO: As seguintes variáveis de ambiente não estão definidas: ${missingVars.join(', ')}`);
  console.error('Defina estas variáveis no painel do Vercel ou em .env');
  process.exit(1);
}

// Iniciar configuração
async function inicializarAmbiente() {
  try {
    console.log('Iniciando configuração do ambiente...');
    
    // Verificar conexão Supabase
    console.log('\n1. Verificando conexão com Supabase...');
    const { supabase } = require('./supabase');
    
    try {
      const { data, error } = await supabase.from('pg_catalog.pg_tables').select('*').limit(1);
      
      if (error) {
        console.error('❌ ERRO AO CONECTAR COM SUPABASE:', error);
        throw error;
      }
      
      console.log('✅ Conexão com Supabase estabelecida com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao verificar conexão com Supabase:', error.message);
      console.error('URL do Supabase:', process.env.SUPABASE_URL || 'Não definido');
      console.error('Chave de serviço disponível:', process.env.SUPABASE_SERVICE_KEY ? 'Sim' : 'Não');
      process.exit(1);
    }
    
    // Inicializar banco de dados
    console.log('\n2. Inicializando banco de dados...');
    try {
      // Importar models
      const { militarModel, escalaModel } = require('./models');
      
      // Criar tabelas
      console.log('- Criando tabela militares...');
      const militaresOK = await militarModel.criarTabelaMilitares();
      console.log(militaresOK ? '✅ Tabela militares criada/verificada com sucesso!' : '❌ Falha ao criar tabela militares');
      
      console.log('- Criando tabela escalas...');
      const escalasOK = await escalaModel.criarTabelaEscalas();
      console.log(escalasOK ? '✅ Tabela escalas criada/verificada com sucesso!' : '❌ Falha ao criar tabela escalas');
      
      console.log('- Criando tabela detalhes_escala...');
      const detalhesOK = await escalaModel.criarTabelaDetalhesEscala();
      console.log(detalhesOK ? '✅ Tabela detalhes_escala criada/verificada com sucesso!' : '❌ Falha ao criar tabela detalhes_escala');
      
      const todasOK = militaresOK && escalasOK && detalhesOK;
      
      if (!todasOK) {
        console.log('\n⚠️ ALERTA: Algumas tabelas não foram criadas corretamente.');
        console.log('Tentando método alternativo...');
        
        // Executar script force-init-tables como alternativa
        console.log('Executando script force-init-tables.js...');
        require('./force-init-tables');
      }
    } catch (dbError) {
      console.error('❌ Erro ao inicializar banco de dados:', dbError.message);
      console.error(dbError);
    }
    
    return true;
  } catch (error) {
    console.error('❌ ERRO FATAL:', error.message);
    console.error(error);
    return false;
  }
}

// Executar inicialização
inicializarAmbiente()
  .then(sucesso => {
    if (sucesso) {
      console.log('\n✅ CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
      console.log('O sistema está pronto para uso.');
      process.exit(0);
    } else {
      console.error('\n❌ FALHA NA CONFIGURAÇÃO!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ ERRO FATAL DURANTE INICIALIZAÇÃO:', error.message);
    console.error(error);
    process.exit(1);
  }); 