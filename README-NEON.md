# Integração do Sistema PMF com Banco de Dados Neon

Este documento explica como configurar e utilizar o banco de dados Neon (PostgreSQL na nuvem) com o Sistema PMF.

## O que é o Neon?

Neon é um serviço de banco de dados PostgreSQL serverless e totalmente gerenciado na nuvem. Ele oferece um plano gratuito que é perfeito para desenvolvimento e projetos pequenos.

## Configuração Inicial

### 1. Criar uma conta no Neon

1. Acesse [https://neon.tech](https://neon.tech) e crie uma conta gratuita
2. Crie um novo projeto no painel do Neon
3. Anote as informações de conexão fornecidas (host, porta, usuário, senha e nome do banco de dados)

### 2. Configurar o arquivo .env

Edite o arquivo `.env` na raiz do projeto e substitua os valores de exemplo pelas suas credenciais reais do Neon:

```
DB_HOST=seu-endpoint-neon.com
DB_PORT=5432
DB_USER=seu-usuario
DB_PASSWORD=sua-senha
DB_NAME=seu-banco-de-dados
```

## Estrutura do Banco de Dados

O sistema cria automaticamente as seguintes tabelas:

1. **militares** - Armazena informações dos militares
   - id, nome, posto, numero_identificacao, unidade, status, data_criacao

2. **escalas** - Armazena informações das escalas
   - id, titulo, data_inicio, data_fim, tipo, status, data_criacao

3. **detalhes_escala** - Armazena os militares designados para cada escala
   - id, escala_id, militar_id, data_servico, horario_inicio, horario_fim, funcao, observacoes

## API REST

O sistema agora inclui uma API REST para interagir com o banco de dados:

### Endpoints de Militares

- `GET /api/militares` - Lista todos os militares
- `POST /api/militares` - Cria um novo militar
- `GET /api/militares/:id` - Obtém detalhes de um militar específico
- `PUT /api/militares/:id` - Atualiza dados de um militar
- `DELETE /api/militares/:id` - Remove um militar

### Endpoints de Escalas

- `GET /api/escalas` - Lista todas as escalas
- `POST /api/escalas` - Cria uma nova escala
- `GET /api/escalas/:id/detalhes` - Obtém detalhes de uma escala específica
- `POST /api/escalas/:id/detalhes` - Adiciona um militar a uma escala

## Exemplo de Uso da API

### Criar um novo militar

```javascript
fetch('/api/militares', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nome: 'João Silva',
    posto: 'Soldado',
    numero_identificacao: '12345',
    unidade: 'Batalhão X'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

### Listar todos os militares

```javascript
fetch('/api/militares')
  .then(response => response.json())
  .then(data => console.log(data.militares));
```

## Solução de Problemas

### Erro de Conexão com o Banco de Dados

Se o servidor não iniciar devido a erros de conexão com o banco de dados:

1. Verifique se as credenciais no arquivo `.env` estão corretas
2. Confirme se o IP do seu servidor está na lista de IPs permitidos no painel do Neon
3. Verifique se o banco de dados está ativo no painel do Neon

### Logs do Servidor

O servidor registra informações detalhadas sobre a conexão com o banco de dados e erros que possam ocorrer. Verifique o console onde o servidor está sendo executado para obter mais informações sobre possíveis problemas.

## Próximos Passos

1. Implementar autenticação de usuários
2. Adicionar validação de dados nas APIs
3. Criar interface de usuário para gerenciar militares e escalas
4. Implementar relatórios e estatísticas