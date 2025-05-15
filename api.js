const http = require('http');
const url = require('url');
const { militarModel, escalaModel } = require('./models');

// Função para processar o corpo da requisição
const processarCorpoRequisicao = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = body ? JSON.parse(body) : {};
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', (error) => {
      reject(error);
    });
  });
};

// Função para enviar resposta JSON
const enviarRespostaJSON = (res, statusCode, dados) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(dados));
};

// Rotas da API
const rotasAPI = {
  // Rotas para militares
  '/api/militares': {
    // Listar todos os militares
    GET: async (req, res) => {
      try {
        const militares = await militarModel.buscarTodos();
        enviarRespostaJSON(res, 200, { militares });
      } catch (error) {
        console.error('Erro ao buscar militares:', error);
        enviarRespostaJSON(res, 500, { erro: 'Erro ao buscar militares' });
      }
    },
    // Criar novo militar
    POST: async (req, res) => {
      try {
        const dados = await processarCorpoRequisicao(req);
        const novoMilitar = await militarModel.inserir(dados);
        enviarRespostaJSON(res, 201, { militar: novoMilitar });
      } catch (error) {
        console.error('Erro ao criar militar:', error);
        enviarRespostaJSON(res, 500, { erro: 'Erro ao criar militar' });
      }
    }
  },
  
  // Rota para militar específico
  '/api/militares/:id': {
    // Obter militar por ID
    GET: async (req, res, params) => {
      try {
        const militar = await militarModel.buscarPorId(params.id);
        if (militar) {
          enviarRespostaJSON(res, 200, { militar });
        } else {
          enviarRespostaJSON(res, 404, { erro: 'Militar não encontrado' });
        }
      } catch (error) {
        console.error(`Erro ao buscar militar ${params.id}:`, error);
        enviarRespostaJSON(res, 500, { erro: 'Erro ao buscar militar' });
      }
    },
    // Atualizar militar
    PUT: async (req, res, params) => {
      try {
        const dados = await processarCorpoRequisicao(req);
        const militarAtualizado = await militarModel.atualizar(params.id, dados);
        if (militarAtualizado) {
          enviarRespostaJSON(res, 200, { militar: militarAtualizado });
        } else {
          enviarRespostaJSON(res, 404, { erro: 'Militar não encontrado' });
        }
      } catch (error) {
        console.error(`Erro ao atualizar militar ${params.id}:`, error);
        enviarRespostaJSON(res, 500, { erro: 'Erro ao atualizar militar' });
      }
    },
    // Remover militar
    DELETE: async (req, res, params) => {
      try {
        const militarRemovido = await militarModel.remover(params.id);
        if (militarRemovido) {
          enviarRespostaJSON(res, 200, { mensagem: 'Militar removido com sucesso' });
        } else {
          enviarRespostaJSON(res, 404, { erro: 'Militar não encontrado' });
        }
      } catch (error) {
        console.error(`Erro ao remover militar ${params.id}:`, error);
        enviarRespostaJSON(res, 500, { erro: 'Erro ao remover militar' });
      }
    }
  },
  
  // Rotas para escalas
  '/api/escalas': {
    // Listar todas as escalas
    GET: async (req, res) => {
      try {
        const escalas = await escalaModel.buscarTodasEscalas();
        enviarRespostaJSON(res, 200, { escalas });
      } catch (error) {
        console.error('Erro ao buscar escalas:', error);
        enviarRespostaJSON(res, 500, { erro: 'Erro ao buscar escalas' });
      }
    },
    // Criar nova escala
    POST: async (req, res) => {
      try {
        const dados = await processarCorpoRequisicao(req);
        const novaEscala = await escalaModel.inserirEscala(dados);
        enviarRespostaJSON(res, 201, { escala: novaEscala });
      } catch (error) {
        console.error('Erro ao criar escala:', error);
        enviarRespostaJSON(res, 500, { erro: 'Erro ao criar escala' });
      }
    }
  },
  
  // Rota para detalhes de uma escala específica
  '/api/escalas/:id/detalhes': {
    // Obter detalhes da escala
    GET: async (req, res, params) => {
      try {
        const detalhes = await escalaModel.buscarDetalhesEscala(params.id);
        enviarRespostaJSON(res, 200, { detalhes });
      } catch (error) {
        console.error(`Erro ao buscar detalhes da escala ${params.id}:`, error);
        enviarRespostaJSON(res, 500, { erro: 'Erro ao buscar detalhes da escala' });
      }
    },
    // Adicionar militar à escala
    POST: async (req, res, params) => {
      try {
        const dados = await processarCorpoRequisicao(req);
        dados.escala_id = params.id; // Garante que o ID da escala seja o correto
        const detalheAdicionado = await escalaModel.adicionarMilitarEscala(dados);
        enviarRespostaJSON(res, 201, { detalhe: detalheAdicionado });
      } catch (error) {
        console.error(`Erro ao adicionar militar à escala ${params.id}:`, error);
        enviarRespostaJSON(res, 500, { erro: 'Erro ao adicionar militar à escala' });
      }
    }
  },
  
  // Rota para remover um detalhe específico de escala
  '/api/escalas/detalhes/:id': {
    // Remover detalhe de escala
    DELETE: async (req, res, params) => {
      try {
        const detalheRemovido = await escalaModel.removerDetalheEscala(params.id);
        if (detalheRemovido) {
          enviarRespostaJSON(res, 200, { mensagem: 'Detalhe de escala removido com sucesso' });
        } else {
          enviarRespostaJSON(res, 404, { erro: 'Detalhe de escala não encontrado' });
        }
      } catch (error) {
        console.error(`Erro ao remover detalhe de escala ${params.id}:`, error);
        enviarRespostaJSON(res, 500, { erro: 'Erro ao remover detalhe de escala' });
      }
    }
  },
  
  // Rota para verificar conexão com Supabase
  '/api/check-supabase': {
    GET: async (req, res) => {
      try {
        const { supabase } = require('./supabase');
        console.log('Verificando conexão com Supabase...');
        
        // Verificar conexão básica com o Supabase
        const { data, error } = await supabase.from('pg_catalog.pg_tables').select('tablename').limit(10);
        
        if (error) {
          console.error('Erro ao conectar com Supabase:', error);
          enviarRespostaJSON(res, 500, { 
            erro: 'Falha na conexão com o Supabase', 
            detalhes: error.message,
            codigo: error.code
          });
          return;
        }
        
        // Verificar tabelas específicas
        const tabelas = ['militares', 'escalas', 'detalhes_escala'];
        const statusTabelas = {};
        
        for (const tabela of tabelas) {
          try {
            const { data: dadosTabela, error: erroTabela } = await supabase
              .from(tabela)
              .select('count');
            
            statusTabelas[tabela] = {
              existe: !erroTabela,
              erro: erroTabela ? erroTabela.message : null,
              quantidade: dadosTabela && dadosTabela.length > 0 ? dadosTabela[0].count : 0
            };
          } catch (erroTabela) {
            statusTabelas[tabela] = {
              existe: false,
              erro: erroTabela.message
            };
          }
        }
        
        // Verificar variáveis de ambiente
        const variaveisAmbiente = {
          SUPABASE_URL: process.env.SUPABASE_URL ? 'Configurado' : 'Não configurado',
          SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 'Configurado' : 'Não configurado',
          SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'Configurado' : 'Não configurado',
          DATABASE_URL: process.env.DATABASE_URL ? 'Configurado' : 'Não configurado',
          NODE_ENV: process.env.NODE_ENV || 'Não configurado'
        };
        
        enviarRespostaJSON(res, 200, {
          status: 'ok',
          mensagem: 'Conexão com Supabase estabelecida',
          tabelas: statusTabelas,
          tabelas_sistema: data.map(t => t.tablename),
          variaveis_ambiente: variaveisAmbiente,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Erro ao verificar Supabase:', error);
        enviarRespostaJSON(res, 500, { 
          erro: 'Erro ao verificar conexão com Supabase', 
          detalhes: error.message 
        });
      }
    }
  },
  
  // Rota para inicializar tabelas
  '/api/force-init-tables': {
    POST: async (req, res) => {
      try {
        const dados = await processarCorpoRequisicao(req);
        const tabela = dados.table; // militares, escalas ou detalhes_escala
        
        console.log(`Solicitação para criar tabela: ${tabela}`);
        
        const { supabase } = require('./supabase');
        const { militarModel, escalaModel } = require('./models');
        
        let resultado = false;
        let mensagem = '';
        
        // Determinar qual tabela criar com base nos dados recebidos
        if (tabela === 'militares') {
          console.log('Criando tabela de militares...');
          resultado = await militarModel.criarTabelaMilitares();
          mensagem = 'Tabela de militares criada/verificada com sucesso!';
        } else if (tabela === 'escalas') {
          console.log('Criando tabela de escalas...');
          resultado = await escalaModel.criarTabelaEscalas();
          mensagem = 'Tabela de escalas criada/verificada com sucesso!';
        } else if (tabela === 'detalhes_escala') {
          console.log('Criando tabela de detalhes da escala...');
          resultado = await escalaModel.criarTabelaDetalhesEscala();
          mensagem = 'Tabela de detalhes da escala criada/verificada com sucesso!';
        } else {
          return enviarRespostaJSON(res, 400, {
            erro: 'Tabela não especificada ou inválida',
            tabelas_validas: ['militares', 'escalas', 'detalhes_escala']
          });
        }
        
        // Verificar se a tabela foi criada corretamente
        const { error } = await supabase.from(tabela).select('count');
        
        if (error) {
          console.error(`Erro ao verificar tabela ${tabela}:`, error);
          
          return enviarRespostaJSON(res, 500, {
            erro: `Falha ao criar tabela ${tabela}`,
            detalhes: error.message,
            sugestao: 'Verifique suas variáveis de ambiente e permissões no Supabase'
          });
        }
        
        return enviarRespostaJSON(res, 200, {
          sucesso: true,
          mensagem,
          tabela
        });
      } catch (error) {
        console.error('Erro ao processar solicitação para criar tabela:', error);
        
        return enviarRespostaJSON(res, 500, {
          erro: 'Erro interno do servidor ao criar tabela',
          detalhes: error.message
        });
      }
    }
  },
  
  // Rota para verificar tabela específica
  '/api/tabelas/:nome': {
    GET: async (req, res) => {
      try {
        const { params } = req;
        const nomeTabela = params.nome;
        
        console.log(`Verificando tabela: ${nomeTabela}`);
        
        const { supabase } = require('./supabase');
        
        // Tentar fazer uma consulta simples na tabela
        const { data, error } = await supabase
          .from(nomeTabela)
          .select('count');
        
        if (error) {
          return enviarRespostaJSON(res, 404, {
            existe: false,
            mensagem: `Tabela '${nomeTabela}' não encontrada ou erro ao verificar: ${error.message}`,
            codigo: error.code
          });
        }
        
        // Verificar a estrutura mínima da tabela
        let estruturaOK = true;
        let colunasVerificadas = [];
        
        try {
          const { data: sampleRecord, error: sampleError } = await supabase
            .from(nomeTabela)
            .select('*')
            .limit(1);
          
          if (!sampleError && sampleRecord && sampleRecord.length > 0) {
            colunasVerificadas = Object.keys(sampleRecord[0]);
          }
        } catch (estruturaError) {
          estruturaOK = false;
          console.error(`Erro ao verificar estrutura da tabela ${nomeTabela}:`, estruturaError);
        }
        
        return enviarRespostaJSON(res, 200, {
          existe: true,
          tabela: nomeTabela,
          quantidade: data[0]?.count || 0,
          estrutura_ok: estruturaOK,
          colunas: colunasVerificadas
        });
      } catch (error) {
        console.error('Erro ao verificar tabela:', error);
        
        return enviarRespostaJSON(res, 500, {
          erro: 'Erro interno do servidor ao verificar tabela',
          detalhes: error.message
        });
      }
    }
  }
};

// Função para processar requisições da API
const processarRequisicaoAPI = async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const metodo = req.method;
  
  // Verifica se a rota começa com /api
  if (!pathname.startsWith('/api')) {
    return false; // Não é uma rota de API
  }
  
  console.log(`Processando requisição API: ${metodo} ${pathname}`);
  
  // Processa parâmetros de rota (ex: /api/militares/123)
  let rotaEncontrada = null;
  let params = {};
  
  // Verifica rotas exatas primeiro
  if (rotasAPI[pathname] && rotasAPI[pathname][metodo]) {
    rotaEncontrada = rotasAPI[pathname][metodo];
    console.log('Rota exata encontrada:', pathname);
  } else {
    // Verifica rotas com parâmetros
    const rotasComParametros = Object.keys(rotasAPI).filter(rota => rota.includes(':'));
    
    for (const rotaParam of rotasComParametros) {
      const partes = rotaParam.split('/');
      const partesUrl = pathname.split('/');
      
      if (partes.length === partesUrl.length) {
        let corresponde = true;
        
        for (let i = 0; i < partes.length; i++) {
          if (partes[i].startsWith(':')) {
            // Extrai o parâmetro
            const paramNome = partes[i].substring(1);
            params[paramNome] = partesUrl[i];
          } else if (partes[i] !== partesUrl[i]) {
            corresponde = false;
            break;
          }
        }
        
        if (corresponde && rotasAPI[rotaParam][metodo]) {
          rotaEncontrada = rotasAPI[rotaParam][metodo];
          console.log('Rota com parâmetros encontrada:', rotaParam, 'Params:', params);
          break;
        }
      }
    }
  }
  
  // Executa o manipulador da rota se encontrado
  if (rotaEncontrada) {
    try {
      // Caso seja um POST ou PUT, vamos logar o corpo da requisição
      if (metodo === 'POST' || metodo === 'PUT') {
        try {
          const corpo = await processarCorpoRequisicao(req);
          console.log('Corpo da requisição:', JSON.stringify(corpo));
        } catch (e) {
          console.error('Erro ao processar corpo da requisição:', e.message);
        }
      }
      
      console.log('Executando handler para:', pathname);
      try {
        await rotaEncontrada(req, res, params);
        console.log('Requisição processada com sucesso:', metodo, pathname);
      } catch (handlerError) {
        console.error(`Erro interno no manipulador da rota ${pathname}:`, handlerError);
        console.error('Stack trace:', handlerError.stack);
        enviarRespostaJSON(res, 500, { 
          erro: 'Erro interno no manipulador da rota',
          mensagem: handlerError.message
        });
      }
      return true; // Requisição processada com sucesso
    } catch (error) {
      console.error('Erro ao processar requisição:', error.message);
      console.error('Stack trace do erro:', error.stack);
      enviarRespostaJSON(res, 500, { 
        erro: 'Erro interno do servidor',
        mensagem: error.message,
        url: pathname
      });
      return true; // Requisição processada (com erro)
    }
  } else {
    console.log('Rota não encontrada:', pathname);
    enviarRespostaJSON(res, 404, { erro: 'Rota não encontrada', url: pathname });
    return true; // Requisição processada (rota não encontrada)
  }
};

module.exports = { processarRequisicaoAPI };