const db = require('./db');

// Funções para gerenciar militares no banco de dados
const militarModel = {
  // Criar tabela de militares se não existir
  async criarTabelaMilitares() {
    const query = `
      CREATE TABLE IF NOT EXISTS militares (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        posto VARCHAR(50) NOT NULL,
        numero_identificacao VARCHAR(20) UNIQUE NOT NULL,
        unidade VARCHAR(50),
        status VARCHAR(20) DEFAULT 'ativo',
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    try {
      await db.query(query);
      console.log('Tabela de militares criada ou já existente');
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
    
    // Obter cliente para transação
    const client = await db.pool.connect();
    
    try {
      // Iniciar transação
      await client.query('BEGIN');
      console.log('Transação iniciada para inserir militar');
      
      // Verificar se já existe um militar com o mesmo número de identificação
      const duplicadoResult = await client.query(
        'SELECT id FROM militares WHERE numero_identificacao = $1',
        [militar.numero_identificacao]
      );
      
      if (duplicadoResult.rows.length > 0) {
        throw new Error(`Já existe um militar com o número de identificação ${militar.numero_identificacao}`);
      }
      
      // Inserir o militar
      const query = `
        INSERT INTO militares (nome, posto, numero_identificacao, unidade, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const values = [
        militar.nome,
        militar.posto,
        militar.numero_identificacao,
        militar.unidade || 'PMF',
        militar.status || 'ativo'
      ];
      
      console.log('Executando INSERT de militar com valores:', values);
      const result = await client.query(query, values);
      
      // Confirmar transação
      await client.query('COMMIT');
      console.log('Transação confirmada com sucesso para o militar');
      
      console.log('Militar criado com sucesso:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      // Reverter transação em caso de erro
      await client.query('ROLLBACK');
      console.error('Transação revertida devido a erro:', error.message);
      console.error('Stack do erro:', error.stack);
      throw error;
    } finally {
      // Liberar o cliente
      client.release();
      console.log('Cliente de transação liberado');
    }
  },

  // Buscar todos os militares
  async buscarTodos() {
    const query = 'SELECT * FROM militares ORDER BY nome';
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar militares:', error);
      throw error;
    }
  },

  // Buscar militar por ID
  async buscarPorId(id) {
    const query = 'SELECT * FROM militares WHERE id = $1';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error(`Erro ao buscar militar com ID ${id}:`, error);
      throw error;
    }
  },

  // Atualizar dados de um militar
  async atualizar(id, dadosAtualizados) {
    const query = `
      UPDATE militares
      SET nome = $1, posto = $2, numero_identificacao = $3, unidade = $4, status = $5
      WHERE id = $6
      RETURNING *
    `;
    
    const values = [
      dadosAtualizados.nome,
      dadosAtualizados.posto,
      dadosAtualizados.numero_identificacao,
      dadosAtualizados.unidade,
      dadosAtualizados.status,
      id
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Erro ao atualizar militar com ID ${id}:`, error);
      throw error;
    }
  },

  // Remover um militar
  async remover(id) {
    const query = 'DELETE FROM militares WHERE id = $1 RETURNING *';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
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
    const query = `
      CREATE TABLE IF NOT EXISTS escalas (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(100) NOT NULL,
        data_inicio DATE NOT NULL,
        data_fim DATE NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'ativa',
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    try {
      await db.query(query);
      console.log('Tabela de escalas criada ou já existente');
      return true;
    } catch (error) {
      console.error('Erro ao criar tabela de escalas:', error);
      return false;
    }
  },

  // Criar tabela de detalhes da escala (militares escalados)
  async criarTabelaDetalhesEscala() {
    const query = `
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
    `;
    
    try {
      await db.query(query);
      console.log('Tabela de detalhes da escala criada ou já existente');
      return true;
    } catch (error) {
      console.error('Erro ao criar tabela de detalhes da escala:', error);
      return false;
    }
  },

  // Inserir uma nova escala
  async inserirEscala(escala) {
    const query = `
      INSERT INTO escalas (titulo, data_inicio, data_fim, tipo, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      escala.titulo,
      escala.data_inicio,
      escala.data_fim,
      escala.tipo,
      escala.status || 'ativa'
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao inserir escala:', error);
      throw error;
    }
  },

  // Adicionar militar à escala (com transação para garantir integridade)
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
    
    // Obter cliente para transação
    const client = await db.pool.connect();
    
    try {
      // Iniciar transação
      await client.query('BEGIN');
      console.log('Transação iniciada');
      
      // Verificar se o militar existe
      const militarResult = await client.query('SELECT id FROM militares WHERE id = $1', [detalheEscala.militar_id]);
      if (militarResult.rows.length === 0) {
        throw new Error(`Militar com ID ${detalheEscala.militar_id} não encontrado`);
      }
      
      // Verificar se a escala existe
      const escalaResult = await client.query('SELECT id FROM escalas WHERE id = $1', [detalheEscala.escala_id]);
      if (escalaResult.rows.length === 0) {
        throw new Error(`Escala com ID ${detalheEscala.escala_id} não encontrada`);
      }
      
      // Verificar se o militar já está escalado para esta data
      const duplicadoResult = await client.query(
        'SELECT id FROM detalhes_escala WHERE militar_id = $1 AND data_servico = $2',
        [detalheEscala.militar_id, detalheEscala.data_servico]
      );
      
      if (duplicadoResult.rows.length > 0) {
        throw new Error(`Militar já está escalado para a data ${detalheEscala.data_servico}`);
      }
      
      // Inserir o detalhe da escala
      const query = `
        INSERT INTO detalhes_escala (escala_id, militar_id, data_servico, horario_inicio, horario_fim, funcao, observacoes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        detalheEscala.escala_id,
        detalheEscala.militar_id,
        detalheEscala.data_servico,
        detalheEscala.horario_inicio,
        detalheEscala.horario_fim,
        detalheEscala.funcao,
        detalheEscala.observacoes
      ];
      
      console.log('Executando INSERT com valores:', values);
      const result = await client.query(query, values);
      
      // Confirmar transação
      await client.query('COMMIT');
      console.log('Transação confirmada com sucesso');
      
      console.log('Detalhe de escala criado com sucesso:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      // Reverter transação em caso de erro
      await client.query('ROLLBACK');
      console.error('Transação revertida devido a erro:', error.message);
      console.error('Stack do erro:', error.stack);
      throw error;
    } finally {
      // Liberar o cliente
      client.release();
      console.log('Cliente de transação liberado');
    }
  },

  // Buscar todas as escalas
  async buscarTodasEscalas() {
    const query = 'SELECT * FROM escalas ORDER BY data_inicio DESC';
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar escalas:', error);
      throw error;
    }
  },

  // Buscar detalhes de uma escala específica
  async buscarDetalhesEscala(escalaId) {
    const query = `
      SELECT de.*, m.nome, m.posto, m.numero_identificacao
      FROM detalhes_escala de
      JOIN militares m ON de.militar_id = m.id
      WHERE de.escala_id = $1
      ORDER BY de.data_servico, de.horario_inicio
    `;
    
    try {
      const result = await db.query(query, [escalaId]);
      return result.rows;
    } catch (error) {
      console.error(`Erro ao buscar detalhes da escala ${escalaId}:`, error);
      throw error;
    }
  },
  
  // Remover um detalhe de escala
  async removerDetalheEscala(detalheId) {
    const query = 'DELETE FROM detalhes_escala WHERE id = $1 RETURNING *';
    
    try {
      const result = await db.query(query, [detalheId]);
      return result.rows[0];
    } catch (error) {
      console.error(`Erro ao remover detalhe de escala com ID ${detalheId}:`, error);
      throw error;
    }
  }
};

// Inicializar as tabelas do banco de dados
async function inicializarBancoDados() {
  try {
    console.log("Iniciando criação das tabelas do banco de dados...");
    
    // Testar conexão primeiro
    try {
      const testResult = await db.query('SELECT 1 as db_test');
      console.log("Teste de conexão bem-sucedido:", testResult.rows[0]);
    } catch (dbError) {
      console.error("ERRO CRÍTICO: Falha no teste de conexão com o banco de dados:", dbError);
      console.error("Verificando a string de conexão e as credenciais...");
      throw new Error("Falha na conexão com o banco de dados. Verifique as credenciais.");
    }
    
    // Criar tabelas em sequência
    const tabelaMilitares = await militarModel.criarTabelaMilitares();
    const tabelaEscalas = await escalaModel.criarTabelaEscalas();
    const tabelaDetalhes = await escalaModel.criarTabelaDetalhesEscala();
    
    // Verificar se todas as tabelas foram criadas
    if (!tabelaMilitares || !tabelaEscalas || !tabelaDetalhes) {
      console.error("AVISO: Nem todas as tabelas foram criadas com sucesso!");
      return false;
    }
    
    // Verificar se as tabelas existem e podem ser consultadas
    try {
      const militaresResult = await db.query('SELECT COUNT(*) FROM militares');
      console.log(`Tabela 'militares' existe e contém ${militaresResult.rows[0].count} registros.`);
      
      const escalasResult = await db.query('SELECT COUNT(*) FROM escalas');
      console.log(`Tabela 'escalas' existe e contém ${escalasResult.rows[0].count} registros.`);
      
      const detalhesResult = await db.query('SELECT COUNT(*) FROM detalhes_escala');
      console.log(`Tabela 'detalhes_escala' existe e contém ${detalhesResult.rows[0].count} registros.`);
    } catch (tableError) {
      console.error("Erro ao verificar tabelas:", tableError);
      console.error("As tabelas podem não ter sido criadas corretamente.");
      return false;
    }
    
    console.log('Banco de dados inicializado com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

module.exports = {
  militarModel,
  escalaModel,
  inicializarBancoDados
};