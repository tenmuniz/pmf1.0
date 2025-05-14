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