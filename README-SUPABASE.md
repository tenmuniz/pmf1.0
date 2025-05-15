# Configuração do Supabase no Sistema PMF

Este guia fornece instruções detalhadas para configurar o banco de dados Supabase com o Sistema PMF e garantir que os dados sejam persistidos corretamente.

## Configuração no Vercel

Para garantir a persistência dos dados, siga estas etapas:

1. **Acesse o dashboard do Vercel**:
   - Faça login em [vercel.com](https://vercel.com/)
   - Acesse seu projeto "pmf1-0"

2. **Configure as variáveis de ambiente**:
   - Vá para "Settings" > "Environment Variables"
   - Adicione as seguintes variáveis:

   ```
   SUPABASE_URL=https://bgyqzowtebcsdujywfom.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXF6b3d0ZWJjc2R1anl3Zm9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzEwMzg2MSwiZXhwIjoyMDYyNjc5ODYxfQ.3f0dM9QTiCo2MY3yX8MbPLL5hjbhtGSoJwo6kejNyII
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXF6b3d0ZWJjc2R1anl3Zm9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDM4NjEsImV4cCI6MjA2MjY3OTg2MX0.Nn1jL9DcUEn5ynB0vjvcxfm1jdJX9od8MVHow0iv7DQ
   DATABASE_URL=postgresql://postgres:postgres@db.bgyqzowtebcsdujywfom.supabase.co:5432/postgres
   NODE_ENV=production
   CREATE_SAMPLE_DATA=true
   ```

3. **Volte para a tela "Deployments"**:
   - Clique em "Redeploy" para aplicar as mudanças
   - Acompanhe os logs da construção para garantir que o banco de dados foi inicializado corretamente

## Verificação no Navegador

Após o deploy, acesse sua aplicação no navegador e:

1. Abra o console do navegador (F12)
2. Utilize o botão "Testar API" para verificar se os dados estão sendo salvos

## Solução de Problemas

Se os dados não estiverem persistindo:

1. **Verifique os logs do Vercel**:
   - Acesse "Deployments" > (último deploy) > "Logs"
   - Procure por erros relacionados ao Supabase ou banco de dados

2. **Execute os seguintes comandos no console do navegador**:
   ```javascript
   // Testar a conexão com a API
   await testApiConnection();
   
   // Verificar o Supabase
   await checkSupabase();
   
   // Adicionar um militar de teste
   await testAddMilitar('Teste Manual', 'Delta', 'T-' + Date.now());
   ```

3. **Verifique as variáveis de ambiente**:
   - Confirme que todas as variáveis estão definidas corretamente no Vercel
   - Certifique-se de que as chaves do Supabase estão corretas

## Comandos Úteis no Vercel

Você pode usar o console do Vercel para executar:

```bash
# Verificar variáveis de ambiente
printenv | grep SUPABASE

# Inicializar banco de dados manualmente
node force-init-tables.js

# Verificar tabelas existentes
node verificar-tabelas-supabase.js
```

## Usando seu próprio banco Supabase

Se quiser usar seu próprio banco Supabase:

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Obtenha a URL e as chaves API do seu projeto
4. Substitua as variáveis de ambiente no Vercel com suas credenciais

## Referência das Tabelas

O sistema utiliza as seguintes tabelas:

1. **militares**
   - `id`: Identificador único (SERIAL PRIMARY KEY)
   - `nome`: Nome do militar (VARCHAR)
   - `posto`: Posto/patente (VARCHAR)
   - `numero_identificacao`: Número de identificação (VARCHAR, UNIQUE)
   - `unidade`: Unidade (VARCHAR)
   - `status`: Status (VARCHAR, DEFAULT 'ativo')

2. **escalas**
   - `id`: Identificador único (SERIAL PRIMARY KEY)
   - `titulo`: Título da escala (VARCHAR)
   - `data_inicio`: Data de início (DATE)
   - `data_fim`: Data de fim (DATE)
   - `tipo`: Tipo de escala (VARCHAR)
   - `status`: Status (VARCHAR, DEFAULT 'ativa')

3. **detalhes_escala**
   - `id`: Identificador único (SERIAL PRIMARY KEY)
   - `escala_id`: Referência à tabela escalas (INTEGER, FOREIGN KEY)
   - `militar_id`: Referência à tabela militares (INTEGER, FOREIGN KEY)
   - `data_servico`: Data do serviço (DATE)
   - `horario_inicio`: Hora de início (TIME)
   - `horario_fim`: Hora de fim (TIME)
   - `funcao`: Função (VARCHAR)
   - `observacoes`: Observações (TEXT) 