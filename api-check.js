// Arquivo para verificar o status da API e do banco Supabase
window.addEventListener('DOMContentLoaded', async function() {
  // Elemento para mostrar o status
  const statusDiv = document.createElement('div');
  statusDiv.style.position = 'fixed';
  statusDiv.style.bottom = '10px';
  statusDiv.style.right = '10px';
  statusDiv.style.background = '#333';
  statusDiv.style.color = '#fff';
  statusDiv.style.padding = '10px';
  statusDiv.style.borderRadius = '5px';
  statusDiv.style.zIndex = '9999';
  statusDiv.style.fontSize = '12px';
  document.body.appendChild(statusDiv);

  statusDiv.textContent = 'Verificando conexão com o banco de dados...';

  try {
    // Tentar obter a lista de militares
    const response = await fetch('/api/militares');
    
    if (response.ok) {
      const data = await response.json();
      statusDiv.style.background = '#4CAF50';
      statusDiv.textContent = `✅ API conectada! ${data.militares ? data.militares.length : 0} militares encontrados.`;
      
      // Verificar se há militares e mostrar
      if (data.militares && data.militares.length > 0) {
        setTimeout(() => {
          const detailsDiv = document.createElement('div');
          detailsDiv.style.position = 'fixed';
          detailsDiv.style.bottom = '60px';
          detailsDiv.style.right = '10px';
          detailsDiv.style.background = '#333';
          detailsDiv.style.color = '#fff';
          detailsDiv.style.padding = '10px';
          detailsDiv.style.borderRadius = '5px';
          detailsDiv.style.zIndex = '9999';
          detailsDiv.style.fontSize = '12px';
          detailsDiv.style.maxHeight = '200px';
          detailsDiv.style.overflowY = 'auto';
          detailsDiv.style.maxWidth = '300px';
          
          detailsDiv.innerHTML = `<strong>Militares cadastrados:</strong><br>`;
          data.militares.forEach(militar => {
            detailsDiv.innerHTML += `• ${militar.nome} (${militar.posto})<br>`;
          });
          
          document.body.appendChild(detailsDiv);
          
          // Fechar após 10 segundos
          setTimeout(() => {
            detailsDiv.remove();
          }, 10000);
        }, 3000);
      }
    } else {
      statusDiv.style.background = '#F44336';
      statusDiv.textContent = `❌ Erro API: ${response.status} - ${response.statusText}`;
    }
  } catch (error) {
    statusDiv.style.background = '#F44336';
    statusDiv.textContent = `❌ Erro de conexão: ${error.message}`;
  }
  
  // Adicionar botão para testar adição de militar
  setTimeout(() => {
    const testButton = document.createElement('button');
    testButton.textContent = '🧪 Testar API';
    testButton.style.position = 'fixed';
    testButton.style.bottom = '10px';
    testButton.style.left = '10px';
    testButton.style.background = '#2196F3';
    testButton.style.color = '#fff';
    testButton.style.padding = '8px 15px';
    testButton.style.border = 'none';
    testButton.style.borderRadius = '5px';
    testButton.style.zIndex = '9999';
    testButton.style.cursor = 'pointer';
    
    testButton.addEventListener('click', async () => {
      const testStatusDiv = document.createElement('div');
      testStatusDiv.style.position = 'fixed';
      testStatusDiv.style.bottom = '60px';
      testStatusDiv.style.left = '10px';
      testStatusDiv.style.background = '#333';
      testStatusDiv.style.color = '#fff';
      testStatusDiv.style.padding = '10px';
      testStatusDiv.style.borderRadius = '5px';
      testStatusDiv.style.zIndex = '9999';
      testStatusDiv.style.fontSize = '12px';
      document.body.appendChild(testStatusDiv);
      
      testStatusDiv.textContent = 'Testando adição de militar...';
      
      try {
        // Criar um militar de teste
        const timestamp = new Date().getTime();
        const testPM = {
          nome: `Teste ${timestamp}`,
          posto: 'Alfa',
          numero_identificacao: `T${timestamp}`,
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
          testStatusDiv.style.background = '#4CAF50';
          testStatusDiv.innerHTML = `✅ Militar teste adicionado com sucesso!<br>ID: ${data.militar.id}`;
          
          // Testar busca após 1 segundo
          setTimeout(async () => {
            // Buscar todos os militares novamente
            const getMilitares = await fetch('/api/militares');
            
            if (getMilitares.ok) {
              const militaresData = await getMilitares.json();
              if (militaresData.militares && militaresData.militares.length > 0) {
                testStatusDiv.innerHTML += `<br>✅ Total de militares: ${militaresData.militares.length}`;
              }
            }
          }, 1000);
          
        } else {
          testStatusDiv.style.background = '#F44336';
          testStatusDiv.textContent = `❌ Erro ao adicionar militar: ${response.status} - ${response.statusText}`;
        }
      } catch (error) {
        testStatusDiv.style.background = '#F44336';
        testStatusDiv.textContent = `❌ Erro no teste: ${error.message}`;
      }
      
      // Remover após 10 segundos
      setTimeout(() => {
        testStatusDiv.remove();
      }, 15000);
    });
    
    document.body.appendChild(testButton);
  }, 2000);
}); 