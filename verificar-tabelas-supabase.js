// Script para verificar tabelas no Supabase
require('dotenv').config();
const { supabase } = require('./supabase');

async function verificarTabelas() {
  console.log('===== VERIFICAÇÃO DE TABELAS NO SUPABASE =====');
  console.log('URL do Supabase:', process.env.SUPABASE_URL || 'Não configurado');
  
  try {
    // Verificar conexão básica
    console.log('\nTestando conexão básica com o Supabase...');
    
    // Primeiro testar uma consulta básica
    const { data: testData, error: testError } = await supabase
      .from('militares')
      .select('count');
    
    if (testError) {
      console.log('Não foi possível consultar a tabela militares:', testError.message);
      
      if (testError.code === '42P01') { // Tabela não existe
        console.log('A tabela militares ainda não existe. Tentando criar...');
      }
    } else {
      console.log('✅ Conexão com tabela militares realizada com sucesso!');
    }
    
    // Testar consulta de tabelas do schema
    try {
      // Para postgres, consultamos informações do schema de forma nativa
      const { data: tables, error: tablesError } = await supabase.rpc('pg_catalog_query', {
        query_text: "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'"
      });
      
      if (tablesError) {
        console.log('Erro ao consultar tabelas via RPC:', tablesError.message);
        
        // Vamos tentar uma outra abordagem
        console.log('Tentando abordagem alternativa para listar tabelas...');
        
        // Consultar cada tabela individualmente
        const tabelasBase = ['militares', 'escalas', 'detalhes_escala'];
        const tabelasExistentes = [];
        
        for (const tabela of tabelasBase) {
          const { error: checkError } = await supabase.from(tabela).select('count');
          if (!checkError) {
            tabelasExistentes.push(tabela);
          }
        }
        
        if (tabelasExistentes.length > 0) {
          console.log(`✅ Tabelas encontradas: ${tabelasExistentes.join(', ')}`);
        } else {
          console.log('❌ Nenhuma das tabelas necessárias foi encontrada');
        }
      } else {
        console.log('✅ Conexão com Supabase estabelecida com sucesso!');
        
        if (tables && tables.length > 0) {
          console.log(`\nTabelas encontradas no esquema 'public': ${tables.length}`);
          console.table(tables);
        } else {
          console.log('Nenhuma tabela encontrada no esquema público.');
        }
      }
    } catch (rpcError) {
      console.log('Erro ao tentar usar RPC para listar tabelas:', rpcError.message);
    }
    
    // Verificar tabelas específicas
    const tabelasNecessarias = [
      { nome: 'militares', colunas: ['id', 'nome', 'posto', 'numero_identificacao', 'unidade', 'status'] },
      { nome: 'escalas', colunas: ['id', 'titulo', 'data_inicio', 'data_fim', 'tipo', 'status'] },
      { nome: 'detalhes_escala', colunas: ['id', 'escala_id', 'militar_id', 'data_servico', 'horario_inicio', 'horario_fim'] }
    ];
    
    console.log('\n----- Verificação de tabelas necessárias -----');
    
    let todasTabelasOK = true;
    
    for (const tabela of tabelasNecessarias) {
      console.log(`\nVerificando tabela: ${tabela.nome}`);
      
      // Verificar se a tabela existe
      const { data: countResult, error: countError } = await supabase
        .from(tabela.nome)
        .select('count');
      
      if (countError) {
        console.log(`❌ Tabela '${tabela.nome}' NÃO EXISTE ou ocorreu erro: ${countError.message}`);
        todasTabelasOK = false;
        
        // Verificar se existe uma função para criar a tabela
        console.log('⚙️ Tentando criar a tabela...');
        
        try {
          // Carregar os modelos
          const { militarModel, escalaModel } = require('./models');
          
          // Determinar qual função chamar com base no nome da tabela
          let resultado = false;
          
          if (tabela.nome === 'militares') {
            resultado = await militarModel.criarTabelaMilitares();
          } else if (tabela.nome === 'escalas') {
            resultado = await escalaModel.criarTabelaEscalas();
          } else if (tabela.nome === 'detalhes_escala') {
            resultado = await escalaModel.criarTabelaDetalhesEscala();
          }
          
          if (resultado) {
            console.log(`✅ Tabela '${tabela.nome}' criada com sucesso!`);
            
            // Verificar novamente a existência da tabela
            const { data: recountResult, error: recountError } = await supabase
              .from(tabela.nome)
              .select('count');
            
            if (!recountError) {
              console.log(`✅ Verificação confirmada: tabela '${tabela.nome}' existe e está funcionando!`);
            }
          } else {
            console.log(`❌ Falha ao criar tabela '${tabela.nome}'`);
          }
        } catch (criacaoError) {
          console.error(`❌ Erro ao criar tabela '${tabela.nome}':`, criacaoError.message);
        }
      } else {
        console.log(`✅ Tabela '${tabela.nome}' existe!`);
        
        // Verificar quantidade de registros
        const quantidade = countResult[0] ? countResult[0].count : 0;
        console.log(`📊 Quantidade de registros: ${quantidade}`);
        
        // Verificar estrutura da tabela (colunas)
        console.log('🔍 Verificando estrutura da tabela...');
        try {
          // Buscar um registro para ver colunas
          const { data: sampleRecord, error: sampleError } = await supabase
            .from(tabela.nome)
            .select('*')
            .limit(1);
          
          if (!sampleError) {
            // Se não há registros, usar outra abordagem para obter metadados
            if (sampleRecord && sampleRecord.length > 0) {
              const colunas = Object.keys(sampleRecord[0]);
              console.log(`📋 Colunas encontradas (${colunas.length}): ${colunas.join(', ')}`);
              
              // Verificar se todas as colunas necessárias existem
              const colunasNecessarias = tabela.colunas;
              const colunasAusentes = colunasNecessarias.filter(col => !colunas.includes(col));
              
              if (colunasAusentes.length > 0) {
                console.log(`⚠️ ALERTA: Colunas necessárias ausentes: ${colunasAusentes.join(', ')}`);
              } else {
                console.log('✅ Todas as colunas necessárias estão presentes!');
              }
            } else {
              console.log('ℹ️ Tabela vazia, impossível verificar colunas através de registros.');
            }
          } else {
            console.log(`⚠️ Erro ao verificar estrutura: ${sampleError.message}`);
          }
        } catch (estruturaError) {
          console.error('❌ Erro ao verificar estrutura da tabela:', estruturaError.message);
        }
      }
    }
    
    // Verificar se todas as tabelas estão OK
    console.log('\n===== RESUMO DA VERIFICAÇÃO =====');
    
    // Verificar novamente as tabelas
    let tabelasExistentes = 0;
    
    for (const tabela of tabelasNecessarias) {
      const { error } = await supabase.from(tabela.nome).select('count');
      
      if (!error) {
        tabelasExistentes++;
      }
    }
    
    console.log(`Tabelas necessárias: ${tabelasNecessarias.length}`);
    console.log(`Tabelas existentes: ${tabelasExistentes}`);
    
    if (tabelasExistentes === tabelasNecessarias.length) {
      console.log('\n✅ TODAS AS TABELAS NECESSÁRIAS FORAM ENCONTRADAS!');
      console.log('O sistema deve funcionar corretamente.');
    } else {
      console.log(`\n⚠️ ATENÇÃO: Apenas ${tabelasExistentes} de ${tabelasNecessarias.length} tabelas necessárias foram encontradas.`);
      console.log('O sistema pode não funcionar corretamente.');
    }
    
  } catch (error) {
    console.error('❌ ERRO FATAL:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Executar verificação
verificarTabelas()
  .then(() => {
    console.log('\nVerificação concluída!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nErro durante verificação:', error);
    process.exit(1);
  }); 