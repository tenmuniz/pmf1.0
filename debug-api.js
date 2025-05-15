// Arquivo de depuração de chamadas de API
// Este arquivo adiciona logs detalhados sobre as requisições e respostas da API

// Sobrescrever o método fetch para adicionar logs
const originalFetch = window.fetch;

// Função de depuração principal
function debugFetch(url, options = {}) {
    const isApiCall = url.startsWith('/api/');
    const method = options.method || 'GET';
    
    // Log para chamadas de API
    if (isApiCall) {
        console.group(`%c📡 API Request: ${method} ${url}`, 'background: #2196F3; color: white; padding: 2px 5px; border-radius: 3px;');
        
        if (options.body) {
            try {
                const bodyData = JSON.parse(options.body);
                console.log('%cRequest Body:', 'font-weight: bold;', bodyData);
            } catch (e) {
                console.log('%cRequest Body (raw):', 'font-weight: bold;', options.body);
            }
        }
        
        console.log('%cRequest Headers:', 'font-weight: bold;', options.headers || 'No headers');
        console.groupEnd();
    }
    
    // Fazer a requisição
    return originalFetch(url, options)
        .then(response => {
            if (isApiCall) {
                const statusColor = response.ok ? '#4CAF50' : '#F44336';
                console.group(`%c📩 API Response: ${response.status} ${response.statusText}`, 
                    `background: ${statusColor}; color: white; padding: 2px 5px; border-radius: 3px;`);
                
                // Clonar a resposta para poder usá-la mais de uma vez
                const clonedResponse = response.clone();
                
                // Processar a resposta JSON apenas se for uma requisição de API
                clonedResponse.json().then(data => {
                    console.log('%cResponse Data:', 'font-weight: bold;', data);
                    console.groupEnd();
                }).catch(err => {
                    console.log('%cResponse could not be parsed as JSON:', 'font-weight: bold; color: #F44336;');
                    console.groupEnd();
                });
            }
            
            return response;
        })
        .catch(error => {
            if (isApiCall) {
                console.group(`%c❌ API Error: ${method} ${url}`, 'background: #F44336; color: white; padding: 2px 5px; border-radius: 3px;');
                console.error('Error details:', error);
                console.groupEnd();
            }
            throw error;
        });
}

// Sobrescrever fetch global
window.fetch = debugFetch;

// Função utilitária para testar a conexão com a API
async function testApiConnection() {
    try {
        const response = await fetch('/api/militares');
        
        if (response.ok) {
            const data = await response.json();
            return {
                success: true,
                message: `Conexão API OK! ${data.militares ? data.militares.length : 0} militares encontrados.`,
                data
            };
        } else {
            return {
                success: false,
                message: `Erro API: ${response.status} - ${response.statusText}`,
                status: response.status
            };
        }
    } catch (error) {
        return {
            success: false,
            message: `Erro de conexão: ${error.message}`,
            error
        };
    }
}

// Função para testar a adição de um militar
async function testAddMilitar(nome, posto, id) {
    try {
        // Criar um militar de teste
        const timestamp = Date.now();
        const testPM = {
            nome: nome || `Teste ${timestamp}`,
            posto: posto || 'Alfa',
            numero_identificacao: id || `T${timestamp}`,
            unidade: 'PMF',
            status: 'ativo'
        };
        
        // Enviar para a API
        const response = await fetch('/api/militares', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testPM)
        });
        
        if (response.ok) {
            const data = await response.json();
            return {
                success: true,
                message: `Militar adicionado com sucesso! ID: ${data.militar.id}`,
                data
            };
        } else {
            return {
                success: false,
                message: `Erro ao adicionar militar: ${response.status} - ${response.statusText}`,
                status: response.status
            };
        }
    } catch (error) {
        return {
            success: false,
            message: `Erro ao adicionar militar: ${error.message}`,
            error
        };
    }
}

// Função para verificar o supabase (query simples)
async function checkSupabase() {
    try {
        const response = await fetch('/api/check-supabase');
        
        if (response.ok) {
            const data = await response.json();
            return {
                success: true,
                message: 'Conexão com Supabase OK!',
                data
            };
        } else {
            return {
                success: false,
                message: `Erro ao verificar Supabase: ${response.status} - ${response.statusText}`,
                status: response.status
            };
        }
    } catch (error) {
        return {
            success: false,
            message: `Erro ao verificar Supabase: ${error.message}`,
            error
        };
    }
}

// Função para forçar a criação das tabelas no Supabase
async function forceInitTables() {
    console.log('Forçando criação de tabelas no Supabase...');
    
    try {
        const statusDiv = document.createElement('div');
        statusDiv.style.position = 'fixed';
        statusDiv.style.top = '10px';
        statusDiv.style.left = '10px';
        statusDiv.style.background = '#333';
        statusDiv.style.color = '#fff';
        statusDiv.style.padding = '10px';
        statusDiv.style.borderRadius = '5px';
        statusDiv.style.zIndex = '9999';
        statusDiv.style.maxWidth = '80%';
        statusDiv.style.maxHeight = '80%';
        statusDiv.style.overflow = 'auto';
        statusDiv.style.fontSize = '12px';
        statusDiv.innerHTML = '<h3>Inicializando banco de dados...</h3>';
        document.body.appendChild(statusDiv);
        
        // Criar tabela de militares
        statusDiv.innerHTML += '<p>Criando tabela de militares...</p>';
        
        const createMilitares = await fetch('/api/force-init-tables', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: 'militares' })
        });
        
        if (createMilitares.ok) {
            statusDiv.innerHTML += '<p style="color: #4CAF50">✅ Tabela de militares criada/verificada!</p>';
        } else {
            statusDiv.innerHTML += '<p style="color: #F44336">❌ Erro ao criar tabela de militares</p>';
        }
        
        // Criar tabela de escalas
        statusDiv.innerHTML += '<p>Criando tabela de escalas...</p>';
        
        const createEscalas = await fetch('/api/force-init-tables', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: 'escalas' })
        });
        
        if (createEscalas.ok) {
            statusDiv.innerHTML += '<p style="color: #4CAF50">✅ Tabela de escalas criada/verificada!</p>';
        } else {
            statusDiv.innerHTML += '<p style="color: #F44336">❌ Erro ao criar tabela de escalas</p>';
        }
        
        // Criar tabela de detalhes_escala
        statusDiv.innerHTML += '<p>Criando tabela de detalhes_escala...</p>';
        
        const createDetalhes = await fetch('/api/force-init-tables', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: 'detalhes_escala' })
        });
        
        if (createDetalhes.ok) {
            statusDiv.innerHTML += '<p style="color: #4CAF50">✅ Tabela de detalhes_escala criada/verificada!</p>';
        } else {
            statusDiv.innerHTML += '<p style="color: #F44336">❌ Erro ao criar tabela de detalhes_escala</p>';
        }
        
        // Verificar status final
        statusDiv.innerHTML += '<h3>Verificando status final...</h3>';
        
        try {
            // Verificar todas as tabelas
            const tabelas = ['militares', 'escalas', 'detalhes_escala'];
            let todasCriadas = true;
            
            for (const tabela of tabelas) {
                const verificaTabela = await fetch(`/api/tabelas/${tabela}`);
                
                if (verificaTabela.ok) {
                    statusDiv.innerHTML += `<p style="color: #4CAF50">✅ Tabela ${tabela} existe e está funcionando!</p>`;
                } else {
                    statusDiv.innerHTML += `<p style="color: #F44336">❌ Tabela ${tabela} não encontrada ou com erro</p>`;
                    todasCriadas = false;
                }
            }
            
            if (todasCriadas) {
                statusDiv.innerHTML += '<h3 style="color: #4CAF50">✅ TODAS AS TABELAS ESTÃO PRONTAS!</h3>';
                statusDiv.innerHTML += '<p>O sistema deve funcionar corretamente agora.</p>';
                
                // Adicionar botão para testar API
                const testButton = document.createElement('button');
                testButton.textContent = 'Testar API agora';
                testButton.style.padding = '5px 10px';
                testButton.style.background = '#2196F3';
                testButton.style.color = 'white';
                testButton.style.border = 'none';
                testButton.style.borderRadius = '3px';
                testButton.style.cursor = 'pointer';
                testButton.style.margin = '10px 0';
                
                testButton.addEventListener('click', async () => {
                    statusDiv.innerHTML += '<p>Testando API...</p>';
                    
                    const testResult = await testAddMilitar(
                        `Usuário Teste ${Date.now()}`, 
                        'Alpha', 
                        `T${Date.now()}`
                    );
                    
                    if (testResult.success) {
                        statusDiv.innerHTML += `<p style="color: #4CAF50">✅ API funcionando! ${testResult.message}</p>`;
                    } else {
                        statusDiv.innerHTML += `<p style="color: #F44336">❌ Erro na API: ${testResult.message}</p>`;
                    }
                });
                
                statusDiv.appendChild(testButton);
                
                // Adicionar botão para recarregar
                const reloadButton = document.createElement('button');
                reloadButton.textContent = 'Recarregar página';
                reloadButton.style.padding = '5px 10px';
                reloadButton.style.background = '#4CAF50';
                reloadButton.style.color = 'white';
                reloadButton.style.border = 'none';
                reloadButton.style.borderRadius = '3px';
                reloadButton.style.cursor = 'pointer';
                reloadButton.style.margin = '10px 0 10px 10px';
                
                reloadButton.addEventListener('click', () => {
                    window.location.reload();
                });
                
                statusDiv.appendChild(reloadButton);
            } else {
                statusDiv.innerHTML += '<h3 style="color: #F44336">⚠️ ALGUMAS TABELAS NÃO FORAM CRIADAS!</h3>';
                statusDiv.innerHTML += '<p>O sistema pode não funcionar corretamente.</p>';
                
                // Adicionar botão para fechar
                const closeButton = document.createElement('button');
                closeButton.textContent = 'Fechar';
                closeButton.style.padding = '5px 10px';
                closeButton.style.background = '#F44336';
                closeButton.style.color = 'white';
                closeButton.style.border = 'none';
                closeButton.style.borderRadius = '3px';
                closeButton.style.cursor = 'pointer';
                closeButton.style.margin = '10px 0';
                
                closeButton.addEventListener('click', () => {
                    statusDiv.remove();
                });
                
                statusDiv.appendChild(closeButton);
            }
        } catch (error) {
            statusDiv.innerHTML += `<p style="color: #F44336">❌ Erro durante verificação: ${error.message}</p>`;
        }
    } catch (error) {
        console.error('Erro ao forçar inicialização das tabelas:', error);
        alert(`Erro ao inicializar banco: ${error.message}`);
    }
}

// Adicionar botão para corrigir banco de dados
window.addEventListener('DOMContentLoaded', () => {
    // Verificar se já existe algum botão de teste no canto inferior esquerdo
    if (!document.querySelector('[data-role="api-test-button"]')) {
        const fixButton = document.createElement('button');
        fixButton.textContent = '🛠️ Corrigir Banco';
        fixButton.setAttribute('data-role', 'api-fix-button');
        fixButton.style.position = 'fixed';
        fixButton.style.bottom = '10px';
        fixButton.style.left = '120px';
        fixButton.style.background = '#FF9800';
        fixButton.style.color = '#fff';
        fixButton.style.padding = '8px 12px';
        fixButton.style.border = 'none';
        fixButton.style.borderRadius = '5px';
        fixButton.style.zIndex = '9999';
        fixButton.style.cursor = 'pointer';
        fixButton.style.fontSize = '12px';
        
        fixButton.addEventListener('click', () => {
            if (confirm('Deseja inicializar/corrigir o banco de dados para resolver problemas de persistência?')) {
                forceInitTables();
            }
        });
        
        document.body.appendChild(fixButton);
    }
});

// Expor funções globalmente
window.testApiConnection = testApiConnection;
window.testAddMilitar = testAddMilitar;
window.checkSupabase = checkSupabase;
window.forceInitTables = forceInitTables; 