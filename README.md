# Sistema PMF 1.0

## Sobre
Sistema de gerenciamento de escalas de patrulhamento para a Polícia Militar.

## Tecnologias
- Node.js
- JavaScript (Vanilla)
- HTML/CSS
- Supabase (PostgreSQL)

## Configuração do Banco de Dados Supabase

### Opção 1: Usando o projeto Supabase existente
O sistema já está configurado para usar um banco de dados Supabase. As credenciais estão definidas nos seguintes arquivos:
- `supabase.js` - Configuração de conexão com o Supabase
- `env-template.js` - Template para o arquivo `.env`

### Opção 2: Usando seu próprio banco Supabase
1. Crie uma conta no [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Obtenha a URL e chaves de API do projeto
4. Crie um arquivo `.env` baseado no `env-template.js` e atualize as credenciais

## Persistência de Dados
O sistema garante a persistência de dados através dos seguintes mecanismos:

1. **Banco de dados Supabase**:
   - Os dados são salvos no PostgreSQL hospedado no Supabase
   - As tabelas são criadas automaticamente na primeira execução
   - O sistema verifica e tenta recriar tabelas caso não existam

2. **Scripts de inicialização automática**:
   - `init-supabase.js` - Inicializa a conexão com o Supabase
   - `force-init-tables.js` - Força a criação de tabelas caso não existam
   - `vercel-build.js` - Executado durante o deploy no Vercel

## PROBLEMA DE PERSISTÊNCIA DE DADOS NO VERCEL

Se ao adicionar militares e escalas, os dados não estiverem sendo salvos no Vercel, siga estes passos:

1. **Configure as variáveis de ambiente necessárias**:
   - Acesse o dashboard do Vercel
   - Vá para Settings > Environment Variables
   - Adicione as seguintes variáveis:

   ```
   SUPABASE_URL=https://bgyqzowtebcsdujywfom.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXF6b3d0ZWJjc2R1anl3Zm9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzEwMzg2MSwiZXhwIjoyMDYyNjc5ODYxfQ.3f0dM9QTiCo2MY3yX8MbPLL5hjbhtGSoJwo6kejNyII
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXF6b3d0ZWJjc2R1anl3Zm9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDM4NjEsImV4cCI6MjA2MjY3OTg2MX0.Nn1jL9DcUEn5ynB0vjvcxfm1jdJX9od8MVHow0iv7DQ
   DATABASE_URL=postgresql://postgres:postgres@db.bgyqzowtebcsdujywfom.supabase.co:5432/postgres
   CREATE_SAMPLE_DATA=true
   ```

2. **Redeploy a aplicação**:
   - Após configurar as variáveis, clique em "Redeploy" no dashboard do Vercel
   - Isso vai iniciar um novo deploy que utilizará as variáveis de ambiente corretas

3. **Verifique no navegador**:
   - Abra o console do navegador (F12)
   - Clique no botão "Testar API" que aparece no canto inferior esquerdo da tela
   - Observe se a conexão foi estabelecida e se os dados estão sendo salvos

Para instruções mais detalhadas, consulte o arquivo [README-SUPABASE.md](README-SUPABASE.md).

## Como executar localmente

Para iniciar o servidor localmente:

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Crie o arquivo `.env` baseado no `env-template.js`
4. Inicialize o banco: `npm run force-init`
5. Execute o comando: `npm start` ou `node app.js`
6. Acesse o sistema no navegador: [http://localhost:8080](http://localhost:8080)

## Scripts úteis

- `npm start` - Inicia o servidor
- `npm run dev` - Inicia o servidor com reload automático (nodemon)
- `npm run force-init` - Força a criação de tabelas no Supabase
- `npm run verify-tables` - Verifica se todas as tabelas existem
- `npm run test-connection` - Testa a conexão com o Supabase
- `npm run verify-all` - Executa todas as verificações

## Solução de problemas

### Dados não estão sendo salvos
1. Verifique se as tabelas foram criadas: `npm run verify-tables`
2. Verifique o log no Console do navegador (F12) para mensagens de erro da API
3. Execute o script de inicialização forçada: `npm run force-init`
4. Verifique se o Supabase está acessível e as chaves estão corretas

### No ambiente Vercel
1. Verifique se todas as variáveis de ambiente estão configuradas no dashboard do Vercel
2. Acesse os logs de build e execução para verificar possíveis erros
3. Certifique-se de que o projeto tem os secrets `SUPABASE_SERVICE_KEY` e `SUPABASE_ANON_KEY` configurados

## Deploy no Vercel

Para fazer o deploy no Vercel:

1. Crie uma conta no [Vercel](https://vercel.com)
2. Conecte seu repositório GitHub
3. Crie um novo projeto e selecione o repositório
4. Configure as seguintes variáveis de ambiente:
   - `SUPABASE_URL`: URL do seu projeto Supabase
   - `SUPABASE_SERVICE_KEY`: Chave de serviço do Supabase
   - `SUPABASE_ANON_KEY`: Chave anônima do Supabase
   - `CREATE_SAMPLE_DATA`: "true" para criar dados de exemplo, "false" caso contrário

## Arquitetura do Sistema

```
├── api.js               # Endpoints da API
├── app.js               # Ponto de entrada principal
├── db.js                # Conexão com banco de dados PostgreSQL
├── debug-api.js         # Ferramentas de depuração da API
├── force-init-tables.js # Script para forçar criação de tabelas
├── init-supabase.js     # Inicialização do Supabase
├── models.js            # Modelos e definições de tabelas
├── script.js            # Lógica do frontend
├── server.js            # Servidor HTTP
├── supabase.js          # Configuração do Supabase
└── vercel-build.js      # Script de build para Vercel
```

## Persistência de dados

O sistema está configurado para salvar todos os dados no Supabase (PostgreSQL). Quando você adiciona informações no sistema, elas são armazenadas no banco de dados, garantindo que seus dados sejam mantidos mesmo após atualizar a página ou reiniciar o sistema.

## Estrutura do banco de dados

O sistema utiliza três tabelas principais:
- `militares`: Armazena informações sobre os policiais militares
- `escalas`: Contém as escalas de serviço
- `detalhes_escala`: Armazena a relação entre militares e escalas

## Observações

Caso precise alterar a porta, edite a constante `PORT` no arquivo `server.js` ou defina a variável de ambiente `PORT`.

## Alterações realizadas

Foi criado um arquivo `server.js` que configura um servidor HTTP simples para servir os arquivos do sistema na porta 8080.