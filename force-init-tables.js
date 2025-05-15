// Script para forçar a criação de tabelas no Supabase
require('dotenv').config();
const { supabase, executeSql } = require('./supabase');
const { militarModel, escalaModel } = require('./models');

async function criarTabelas() {
  console.log('===== INICIALIZAÇÃO FORÇADA DE TABELAS =====');
  
  try {
    console.log('Verificando conexão com Supabase...');
    
    // Testar conexão com Supabase usando uma query simples
    const { data, error } = await supabase
      .from('militares')
      .select('count');
    
    if (error && error.code === '42P01') {
      console.log('A tabela de militares não existe. Isso é esperado. Vamos criá-la.');
    } else if (error) {
      console.error('❌ ERRO AO CONECTAR COM SUPABASE:', error);
      console.log('Vamos tentar criar as tabelas mesmo assim...');
    } else {
      console.log('✅ Conexão com Supabase estabelecida com sucesso!');
      console.log(`Quantidade de militares: ${data[0]?.count || 0}`);
    }
    
    // Definir tabelas para criar com SQL direto
    const tabelas = [
      {
        nome: 'militares',
        funcao: militarModel.criarTabelaMilitares,
        sql: `
          CREATE TABLE IF NOT EXISTS militares (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(100) NOT NULL,
            posto VARCHAR(50) NOT NULL,
            numero_identificacao VARCHAR(20) UNIQUE NOT NULL,
            unidade VARCHAR(50),
            status VARCHAR(20) DEFAULT 'ativo',
            data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        nome: 'escalas',
        funcao: escalaModel.criarTabelaEscalas,
        sql: `
          CREATE TABLE IF NOT EXISTS escalas (
            id SERIAL PRIMARY KEY,
            titulo VARCHAR(100) NOT NULL,
            data_inicio DATE NOT NULL,
            data_fim DATE NOT NULL,
            tipo VARCHAR(50) NOT NULL,
            status VARCHAR(20) DEFAULT 'ativa',
            data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        nome: 'detalhes_escala',
        funcao: escalaModel.criarTabelaDetalhesEscala,
        sql: `
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
          );
        `
      }
    ];
    
    // Tentar executar SQL diretamente
    console.log('\n----- CRIANDO TABELAS VIA SQL DIRETO -----');
    
    // Concatenar todas as tabelas em um único SQL
    const sqlCompleto = tabelas.map(t => t.sql).join('\n');
    
    try {
      // Tentar executar via rpc se disponível
      console.log('Tentando criar todas as tabelas via RPC SQL...');
      const { data: sqlResult, error: sqlError } = await executeSql(sqlCompleto);
      
      if (sqlError) {
        console.error('Erro ao executar SQL via RPC:', sqlError.message);
        console.log('Vamos tentar criar cada tabela individualmente usando os modelos...');
      } else {
        console.log('✅ SQL executado com sucesso via RPC!');
      }
    } catch (sqlExecError) {
      console.error('Exceção ao executar SQL:', sqlExecError.message);
    }
    
    // Tentar cada tabela individualmente usando as funções dos modelos
    console.log('\n----- CRIAÇÃO DE TABELAS VIA MODELOS -----');
    
    for (const tabela of tabelas) {
      console.log(`\nProcessando tabela: ${tabela.nome}`);
      
      // Verificar se a tabela já existe
      const { error: checkError } = await supabase.from(tabela.nome).select('count');
      
      if (checkError) {
        console.log(`Tabela '${tabela.nome}' não existe. Tentando criar...`);
        
        try {
          // Primeiro tenta usando a função do modelo
          let criado = false;
          
          if (tabela.funcao) {
            console.log('Usando função do modelo para criar tabela...');
            criado = await tabela.funcao();
          }
          
          // Verificar novamente se a tabela foi criada
          const { error: recheckError } = await supabase.from(tabela.nome).select('count');
          
          if (!recheckError) {
            console.log(`✅ Tabela '${tabela.nome}' criada e verificada com sucesso!`);
            criado = true;
          } else if (!criado) {
            // Se não foi criada, tentar SQL direto
            console.log('Tentando criar tabela com SQL direto...');
            
            try {
              // Resolver problema das dependências das tabelas
              if (tabela.nome === 'detalhes_escala') {
                // Verificar se as tabelas dependentes existem
                const { error: militaresError } = await supabase.from('militares').select('count');
                const { error: escalasError } = await supabase.from('escalas').select('count');
                
                if (militaresError || escalasError) {
                  console.log('As tabelas dependentes não existem. Criando primeiro...');
                  
                  if (militaresError) {
                    await militarModel.criarTabelaMilitares();
                  }
                  
                  if (escalasError) {
                    await escalaModel.criarTabelaEscalas();
                  }
                }
              }
              
              // Tentar executar SQL direto para esta tabela
              const { data: sqlSingleResult, error: sqlSingleError } = await executeSql(tabela.sql);
              
              if (sqlSingleError) {
                console.error(`❌ Erro ao executar SQL para '${tabela.nome}':`, sqlSingleError.message);
                
                // Última tentativa: usar o queryFallback
                console.log('Tentando usar queryFallback como último recurso...');
                const db = require('./db');
                await db.queryFallback(tabela.sql);
              } else {
                console.log(`✅ SQL executado para '${tabela.nome}'`);
                criado = true;
              }
            } catch (createSQLError) {
              console.error(`❌ Erro ao criar tabela '${tabela.nome}' via SQL:`, createSQLError.message);
            }
          }
        } catch (createError) {
          console.error(`❌ Erro ao criar tabela '${tabela.nome}':`, createError.message);
        }
      } else {
        console.log(`✅ Tabela '${tabela.nome}' já existe!`);
      }
    }
    
    // Verificar todas as tabelas novamente
    console.log('\n----- VERIFICAÇÃO FINAL -----');
    let todasCriadas = true;
    
    for (const tabela of tabelas) {
      const { error: finalCheckError } = await supabase.from(tabela.nome).select('count');
      
      if (finalCheckError) {
        console.error(`❌ Tabela '${tabela.nome}' NÃO foi criada corretamente.`);
        todasCriadas = false;
      } else {
        console.log(`✅ Tabela '${tabela.nome}' existe e está funcionando.`);
      }
    }
    
    // Cria dados de exemplo se necessário
    if (todasCriadas && process.env.CREATE_SAMPLE_DATA === 'true') {
      console.log('\n----- CRIANDO DADOS DE EXEMPLO -----');
      
      // Verificar se já existem militares
      const { data: militaresExistentes } = await supabase.from('militares').select('count');
      
      if (militaresExistentes && militaresExistentes.length > 0 && militaresExistentes[0].count > 0) {
        console.log(`Já existem ${militaresExistentes[0].count} militares. Pulando criação de exemplos.`);
      } else {
        console.log('Criando militares de exemplo...');
        
        // Militares de exemplo
        const militaresExemplo = [
          {
            nome: 'João Silva',
            posto: 'Alfa',
            numero_identificacao: '12345',
            unidade: 'PMF',
            status: 'ativo'
          },
          {
            nome: 'Maria Oliveira',
            posto: 'Bravo',
            numero_identificacao: '67890',
            unidade: 'PMF',
            status: 'ativo'
          },
          {
            nome: 'Pedro Santos',
            posto: 'Charlie',
            numero_identificacao: '54321',
            unidade: 'PMF',
            status: 'ativo'
          }
        ];
        
        for (const militar of militaresExemplo) {
          try {
            const { data, error } = await militarModel.inserir(militar);
            
            if (error) {
              console.error(`❌ Erro ao inserir militar '${militar.nome}':`, error);
            } else {
              console.log(`✅ Militar '${militar.nome}' inserido com sucesso.`);
            }
          } catch (insertError) {
            console.error(`❌ Exceção ao inserir militar '${militar.nome}':`, insertError.message);
          }
        }
      }
    }
    
    return todasCriadas;
  } catch (error) {
    console.error('❌ ERRO FATAL:', error);
    return false;
  }
}

// Executar script
criarTabelas()
  .then(sucesso => {
    if (sucesso) {
      console.log('\n✅ TODAS AS TABELAS FORAM CRIADAS COM SUCESSO!');
    } else {
      console.log('\n⚠️ HOUVE PROBLEMAS NA CRIAÇÃO DE ALGUMAS TABELAS. Verifique os logs acima.');
    }
    process.exit(sucesso ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ ERRO FATAL DURANTE EXECUÇÃO:', error);
    process.exit(1);
  }); 