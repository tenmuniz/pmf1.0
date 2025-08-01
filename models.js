const db = require('./db');
const { supabase } = db;

// Funções para gerenciar militares no banco de dados
const militarModel = {
  // Criar tabela de militares se não existir
  async criarTabelaMilitares() {
    try {
      // Verificar primeiro se a tabela já existe
      const { data, error } = await supabase.from('militares').select('count');
      
      if (!error) {
        console.log('Tabela militares já existe');
        return true;
      }
      
      // Usando query fallback para criar a tabela
      await db.queryFallback(`
        CREATE TABLE IF NOT EXISTS militares (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(100) NOT NULL,
          posto VARCHAR(50) NOT NULL,
          numero_identificacao VARCHAR(20) UNIQUE NOT NULL,
          unidade VARCHAR(50),
          status VARCHAR(20) DEFAULT 'ativo',
          data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('Tabela de militares criada com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao criar tabela de militares:', error);
      return false;
    }
  },

  // Inserir um novo militar (com transação)
  async inserir(militar) {
    // Validar dados obrigatórios
    if (!militar.nome || !militar.posto || !militar.numero_identificacao) {
      console.error('Erro ao inserir militar: Dados obrigatórios ausentes.', militar);
      throw new Error('Dados obrigatórios ausentes (nome, posto, numero_identificacao)');
    }
    
    console.log(`Inserindo novo militar: ${militar.nome}, ${militar.posto}`);
    
    try {
      // Verificar se já existe um militar com o mesmo número de identificação
      const { data: existingMilitar, error: searchError } = await supabase
        .from('militares')
        .select('id')
        .eq('numero_identificacao', militar.numero_identificacao)
        .single();
      
      if (searchError && searchError.code !== 'PGRST116') {
        // PGRST116 é o código de erro quando nenhum registro é encontrado
        throw searchError;
      }
      
      if (existingMilitar) {
        throw new Error(`Já existe um militar com o número de identificação ${militar.numero_identificacao}`);
      }
      
      // Inserir o militar
      const { data, error } = await supabase
        .from('militares')
        .insert({
          nome: militar.nome,
          posto: militar.posto,
          numero_identificacao: militar.numero_identificacao,
          unidade: militar.unidade || 'PMF',
          status: militar.status || 'ativo'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('Militar criado com sucesso:', data);
      return data;
    } catch (error) {
      console.error('Erro ao inserir militar:', error.message);
      console.error('Stack trace do erro:', error.stack);
      throw error;
    }
  },

  // Buscar todos os militares
  async buscarTodos() {
    try {
      const { data, error } = await supabase
        .from('militares')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar militares:', error);
      throw error;
    }
  },

  // Buscar militar por ID
  async buscarPorId(id) {
    try {
      const { data, error } = await supabase
        .from('militares')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error(`Erro ao buscar militar com ID ${id}:`, error);
      throw error;
    }
  },

  // Atualizar dados de um militar
  async atualizar(id, dadosAtualizados) {
    try {
      const { data, error } = await supabase
        .from('militares')
        .update({
          nome: dadosAtualizados.nome,
          posto: dadosAtualizados.posto,
          numero_identificacao: dadosAtualizados.numero_identificacao,
          unidade: dadosAtualizados.unidade,
          status: dadosAtualizados.status
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error(`Erro ao atualizar militar com ID ${id}:`, error);
      throw error;
    }
  },

  // Remover um militar
  async remover(id) {
    try {
      const { data, error } = await supabase
        .from('militares')
        .delete()
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error(`Erro ao remover militar com ID ${id}:`, error);
      throw error;
    }
  }
};

// Funções para gerenciar escalas no banco de dados
const escalaModel = {
  // Criar tabela de escalas se não existir
  async criarTabelaEscalas() {
    try {
      // Verificar primeiro se a tabela já existe
      const { data, error } = await supabase.from('escalas').select('count');
      
      if (!error) {
        console.log('Tabela escalas já existe');
        return true;
      }
      
      // Usando query fallback para criar a tabela
      await db.queryFallback(`
        CREATE TABLE IF NOT EXISTS escalas (
          id SERIAL PRIMARY KEY,
          titulo VARCHAR(100) NOT NULL,
          data_inicio DATE NOT NULL,
          data_fim DATE NOT NULL,
          tipo VARCHAR(50) NOT NULL,
          status VARCHAR(20) DEFAULT 'ativa',
          data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('Tabela de escalas criada com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao criar tabela de escalas:', error);
      return false;
    }
  },

  // Criar tabela de detalhes da escala (militares escalados)
  async criarTabelaDetalhesEscala() {
    try {
      // Verificar primeiro se a tabela já existe
      const { data, error } = await supabase.from('detalhes_escala').select('count');
      
      if (!error) {
        console.log('Tabela detalhes_escala já existe');
        return true;
      }
      
      // Usando query fallback para criar a tabela
      await db.queryFallback(`
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
      `);
      
      console.log('Tabela de detalhes da escala criada com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao criar tabela de detalhes da escala:', error);
      return false;
    }
  },

  // Inserir uma nova escala
  async inserirEscala(escala) {
    try {
      const { data, error } = await supabase
        .from('escalas')
        .insert({
          titulo: escala.titulo,
          data_inicio: escala.data_inicio,
          data_fim: escala.data_fim,
          tipo: escala.tipo,
          status: escala.status || 'ativa'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Erro ao inserir escala:', error);
      throw error;
    }
  },

  // Adicionar militar à escala
  async adicionarMilitarEscala(detalheEscala) {
    // Validar dados obrigatórios
    if (!detalheEscala.escala_id || !detalheEscala.militar_id || !detalheEscala.data_servico) {
      console.error('Erro ao adicionar militar à escala: Dados obrigatórios ausentes.', detalheEscala);
      throw new Error('Dados obrigatórios ausentes (escala_id, militar_id, data_servico)');
    }
    
    // Garantir formato de data
    if (!(detalheEscala.data_servico instanceof Date) && typeof detalheEscala.data_servico === 'string') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(detalheEscala.data_servico)) {
        console.error('Erro de formato de data:', detalheEscala.data_servico);
        throw new Error('Formato de data inválido. Use YYYY-MM-DD');
      }
    }
    
    // Adicionar valores padrão caso não sejam fornecidos
    detalheEscala.horario_inicio = detalheEscala.horario_inicio || '08:00:00';
    detalheEscala.horario_fim = detalheEscala.horario_fim || '18:00:00';
    detalheEscala.funcao = detalheEscala.funcao || 'Patrulhamento';
    detalheEscala.observacoes = detalheEscala.observacoes || '';
    
    console.log(`Adicionando militar ID ${detalheEscala.militar_id} à escala ID ${detalheEscala.escala_id} para data ${detalheEscala.data_servico}.`);
    
    try {
      // Verificar se o militar existe
      const { data: militar, error: militarError } = await supabase
        .from('militares')
        .select('id')
        .eq('id', detalheEscala.militar_id)
        .single();
      
      if (militarError) {
        throw new Error(`Militar com ID ${detalheEscala.militar_id} não encontrado`);
      }
      
      // Verificar se a escala existe
      const { data: escala, error: escalaError } = await supabase
        .from('escalas')
        .select('id')
        .eq('id', detalheEscala.escala_id)
        .single();
      
      if (escalaError) {
        throw new Error(`Escala com ID ${detalheEscala.escala_id} não encontrada`);
      }
      
      // Verificar se o militar já está escalado para esta data
      const { data: duplicado, error: duplicadoError } = await supabase
        .from('detalhes_escala')
        .select('id')
        .eq('militar_id', detalheEscala.militar_id)
        .eq('data_servico', detalheEscala.data_servico);
      
      if (duplicadoError) throw duplicadoError;
      
      if (duplicado && duplicado.length > 0) {
        throw new Error(`Militar já está escalado para a data ${detalheEscala.data_servico}`);
      }
      
      // Inserir o detalhe da escala
      const { data, error } = await supabase
        .from('detalhes_escala')
        .insert({
          escala_id: detalheEscala.escala_id,
          militar_id: detalheEscala.militar_id,
          data_servico: detalheEscala.data_servico,
          horario_inicio: detalheEscala.horario_inicio,
          horario_fim: detalheEscala.horario_fim,
          funcao: detalheEscala.funcao,
          observacoes: detalheEscala.observacoes
        })
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('Detalhe de escala criado com sucesso:', data);
      return data;
    } catch (error) {
      console.error('Erro ao adicionar militar à escala:', error.message);
      console.error('Stack trace do erro:', error.stack);
      throw error;
    }
  },

  // Buscar todas as escalas
  async buscarTodasEscalas() {
    try {
      const { data, error } = await supabase
        .from('escalas')
        .select('*')
        .order('data_inicio', { ascending: false });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar escalas:', error);
      throw error;
    }
  },

  // Buscar detalhes de uma escala específica
  async buscarDetalhesEscala(escalaId) {
    try {
      const { data, error } = await supabase
        .from('detalhes_escala')
        .select(`
          *,
          militares (nome, posto, numero_identificacao)
        `)
        .eq('escala_id', escalaId)
        .order('data_servico')
        .order('horario_inicio');
      
      if (error) throw error;
      
      // Formatar os dados para corresponder ao formato esperado pelo front-end
      const formattedData = data.map(item => ({
        ...item,
        nome: item.militares.nome,
        posto: item.militares.posto,
        numero_identificacao: item.militares.numero_identificacao
      }));
      
      return formattedData;
    } catch (error) {
      console.error(`Erro ao buscar detalhes da escala ${escalaId}:`, error);
      throw error;
    }
  },
  
  // Remover um detalhe de escala
  async removerDetalheEscala(detalheId) {
    try {
      const { data, error } = await supabase
        .from('detalhes_escala')
        .delete()
        .eq('id', detalheId)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error(`Erro ao remover detalhe de escala com ID ${detalheId}:`, error);
      throw error;
    }
  }
};

// Inicializar as tabelas do banco de dados
async function inicializarBancoDados() {
  console.log('Inicializando banco de dados...');
  
  try {
    // Criar tabelas se não existirem
    const tabelaMilitaresOK = await militarModel.criarTabelaMilitares();
    const tabelaEscalasOK = await escalaModel.criarTabelaEscalas();
    const tabelaDetalhesEscalaOK = await escalaModel.criarTabelaDetalhesEscala();
    
    // Verificar se todas as tabelas foram criadas com sucesso
    if (tabelaMilitaresOK && tabelaEscalasOK && tabelaDetalhesEscalaOK) {
      console.log('Todas as tabelas inicializadas com sucesso!');
      
      // Adicionar dados de teste, se requisitado
      if (process.env.CREATE_SAMPLE_DATA === 'true') {
        await criarDadosExemplo();
      }
      
      return true;
    } else {
      console.error('Falha ao inicializar uma ou mais tabelas.');
      return false;
    }
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Função para criar dados de exemplo para testes
async function criarDadosExemplo() {
  try {
    console.log('Criando dados de exemplo...');
    
    // Verificar se já existem militares
    const { data: militaresExistentes } = await supabase.from('militares').select('count');
    
    // Se já existirem militares, não cria novamente
    if (militaresExistentes && militaresExistentes.length > 0 && militaresExistentes[0].count > 0) {
      console.log('Já existem militares na base. Pulando criação de dados de exemplo.');
      return true;
    }
    
    // Dados de exemplo para militares
    const militaresExemplo = [
      {
        nome: 'João Silva',
        posto: 'Alfa',
        numero_identificacao: '12345',
        unidade: 'PMF'
      },
      {
        nome: 'Maria Oliveira',
        posto: 'Bravo',
        numero_identificacao: '67890',
        unidade: 'PMF'
      },
      {
        nome: 'Pedro Santos',
        posto: 'Charlie',
        numero_identificacao: '54321',
        unidade: 'PMF'
      }
    ];
    
    // Inserir militares
    for (const militar of militaresExemplo) {
      await militarModel.inserir(militar);
    }
    console.log(`${militaresExemplo.length} militares de exemplo criados.`);
    
    // Criar uma escala de exemplo
    const dataAtual = new Date();
    const dataFim = new Date();
    dataFim.setDate(dataAtual.getDate() + 7); // Uma semana à frente
    
    const escalaExemplo = {
      titulo: 'Escala semanal',
      data_inicio: dataAtual.toISOString().split('T')[0],
      data_fim: dataFim.toISOString().split('T')[0],
      tipo: 'Patrulhamento',
      status: 'ativa'
    };
    
    const novaEscala = await escalaModel.inserirEscala(escalaExemplo);
    console.log('Escala de exemplo criada:', novaEscala);
    
    // Adicionar detalhes à escala
    if (novaEscala && novaEscala.id) {
      // Adicionar cada militar a um dia da escala
      const militaresIds = militaresExemplo.map((_, idx) => idx + 1);
      
      for (let i = 0; i < militaresIds.length; i++) {
        const data = new Date();
        data.setDate(dataAtual.getDate() + i);
        
        const detalhe = {
          escala_id: novaEscala.id,
          militar_id: militaresIds[i],
          data_servico: data.toISOString().split('T')[0],
          horario_inicio: '08:00',
          horario_fim: '18:00',
          funcao: 'Patrulhamento'
        };
        
        await escalaModel.adicionarMilitarEscala(detalhe);
      }
      
      console.log(`${militaresIds.length} detalhes de escala criados.`);
    }
    
    console.log('Dados de exemplo criados com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao criar dados de exemplo:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Exportar os modelos e funções necessárias
module.exports = {
  militarModel,
  escalaModel,
  inicializarBancoDados
};