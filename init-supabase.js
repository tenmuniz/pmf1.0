// Script para inicializar as tabelas no Supabase
const { supabase } = require('./supabase');
const { militarModel, escalaModel } = require('./models');

async function main() {
  console.log('Iniciando a configuração do banco de dados Supabase...');

  try {
    // Verifica a conexão com o Supabase
    console.log('Testando conexão com o Supabase...');
    const { data, error } = await supabase.from('pg_catalog.pg_tables').select('*').limit(1);
    
    if (error) {
      console.error('Erro ao conectar com o Supabase:', error.message);
      throw error;
    }
    
    console.log('Conexão com o Supabase estabelecida com sucesso!');
    
    // Criar tabelas necessárias
    console.log('Criando tabelas necessárias...');
    
    // Tabela de militares
    const militaresOk = await militarModel.criarTabelaMilitares();
    console.log(`Tabela de militares: ${militaresOk ? 'OK' : 'FALHA'}`);
    
    // Tabela de escalas
    const escalasOk = await escalaModel.criarTabelaEscalas();
    console.log(`Tabela de escalas: ${escalasOk ? 'OK' : 'FALHA'}`);
    
    // Tabela de detalhes da escala
    const detalhesEscalaOk = await escalaModel.criarTabelaDetalhesEscala();
    console.log(`Tabela de detalhes da escala: ${detalhesEscalaOk ? 'OK' : 'FALHA'}`);

    // Verificar se todas as tabelas foram criadas
    const todasTabelasOk = militaresOk && escalasOk && detalhesEscalaOk;
    
    console.log('===================================');
    console.log(`Configuração do banco de dados: ${todasTabelasOk ? 'CONCLUÍDA' : 'COM FALHAS'}`);
    console.log('===================================');
    
    if (!todasTabelasOk) {
      console.error('Houve falhas na criação de algumas tabelas. Verifique os logs acima.');
    } else {
      console.log('Sistema pronto para uso!');
    }
    
    // Adicionar alguns dados de exemplo (opcional)
    if (process.env.CREATE_SAMPLE_DATA === 'true') {
      await criarDadosExemplo();
    }
    
    return todasTabelasOk;
  } catch (error) {
    console.error('Erro durante a inicialização do banco de dados:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Função para criar dados de exemplo
async function criarDadosExemplo() {
  console.log('Criando dados de exemplo...');
  
  try {
    // Verificar se já existem militares
    const { data: militaresExistentes } = await supabase.from('militares').select('count');
    
    if (militaresExistentes && militaresExistentes.length > 0 && militaresExistentes[0].count > 0) {
      console.log('Já existem militares no banco. Pulando a criação de dados de exemplo.');
      return;
    }
    
    // Criar militares de exemplo
    const militares = [
      {
        nome: 'João Silva',
        posto: 'Sargento',
        numero_identificacao: '12345',
        unidade: 'PMF',
        status: 'ativo'
      },
      {
        nome: 'Maria Oliveira',
        posto: 'Cabo',
        numero_identificacao: '67890',
        unidade: 'PMF',
        status: 'ativo'
      },
      {
        nome: 'Pedro Santos',
        posto: 'Soldado',
        numero_identificacao: '54321',
        unidade: 'PMF',
        status: 'ativo'
      }
    ];
    
    for (const militar of militares) {
      await militarModel.inserir(militar);
    }
    
    console.log(`${militares.length} militares de exemplo criados com sucesso!`);
    
    // Criar uma escala de exemplo
    const hoje = new Date();
    const fimDaSemana = new Date();
    fimDaSemana.setDate(hoje.getDate() + 7);
    
    const escala = {
      titulo: 'Escala Semanal',
      data_inicio: hoje.toISOString().split('T')[0],
      data_fim: fimDaSemana.toISOString().split('T')[0],
      tipo: 'Patrulhamento',
      status: 'ativa'
    };
    
    const novaEscala = await escalaModel.inserirEscala(escala);
    console.log('Escala de exemplo criada com sucesso!');
    
    console.log('Dados de exemplo criados com sucesso!');
  } catch (error) {
    console.error('Erro ao criar dados de exemplo:', error.message);
  }
}

// Se este arquivo for executado diretamente
if (require.main === module) {
  main()
    .then(() => {
      console.log('Inicialização concluída!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Erro fatal durante a inicialização:', error);
      process.exit(1);
    });
} else {
  // Exportar função para uso em outros arquivos
  module.exports = { inicializarSupabase: main };
} 