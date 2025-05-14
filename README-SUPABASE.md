# Configuração do Supabase para o Sistema PMF 1.0

Este guia contém instruções para configurar o Supabase como banco de dados para o Sistema PMF 1.0.

## Chaves e Credenciais

O sistema já está configurado com as seguintes credenciais:

- **URL do Supabase**: https://bgyqzowtebcsdujywfom.supabase.co
- **Chave service_role**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXF6b3d0ZWJjc2R1anl3Zm9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzEwMzg2MSwiZXhwIjoyMDYyNjc5ODYxfQ.3f0dM9QTiCo2MY3yX8MbPLL5hjbhtGSoJwo6kejNyII
- **Chave anon/public**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXF6b3d0ZWJjc2R1anl3Zm9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDM4NjEsImV4cCI6MjA2MjY3OTg2MX0.Nn1jL9DcUEn5ynB0vjvcxfm1jdJX9od8MVHow0iv7DQ

## Criação das Tabelas

O Supabase não permite a criação de tabelas programaticamente usando a API REST sem SQL functions personalizadas. É necessário criar as tabelas manualmente através do painel de controle do Supabase.

### Passo a Passo para Criar as Tabelas

1. Acesse o painel do Supabase: https://app.supabase.com
2. Selecione seu projeto
3. Vá para "Table Editor" no menu lateral
4. Clique em "SQL Editor"
5. Cole e execute os seguintes SQLs:

```sql
-- Tabela de militares
CREATE TABLE militares (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  posto TEXT NOT NULL,
  numero_identificacao TEXT NOT NULL UNIQUE,
  unidade TEXT,
  status TEXT DEFAULT 'ativo',
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de escalas
CREATE TABLE escalas (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  tipo TEXT NOT NULL,
  status TEXT DEFAULT 'ativa',
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de detalhes da escala
CREATE TABLE detalhes_escala (
  id SERIAL PRIMARY KEY,
  escala_id INTEGER REFERENCES escalas(id) ON DELETE CASCADE,
  militar_id INTEGER REFERENCES militares(id) ON DELETE CASCADE,
  data_servico DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  funcao TEXT,
  observacoes TEXT,
  UNIQUE(escala_id, militar_id, data_servico)
);
```

## Verificação da Configuração

Para verificar se as tabelas foram criadas corretamente, execute o script de verificação:

```bash
node verificar-tabelas.js
```

Este script testará a conexão com o Supabase e verificará se todas as tabelas necessárias existem.

## Solução de Problemas

Se encontrar algum erro durante a execução do sistema, verifique os seguintes pontos:

1. **Conexão com o Supabase**: Verifique se o Supabase está acessível e se as chaves API estão corretas.
2. **Tabelas**: Execute o script `verificar-tabelas.js` para confirmar que todas as tabelas necessárias existem.
3. **Permissões**: No painel do Supabase, verifique se as políticas de segurança (RLS) permitem operações nas tabelas.

## Observações

O sistema está configurado para usar o Supabase como banco de dados principal, mas mantém compatibilidade com o PostgreSQL direto como fallback. Isso garante que, caso haja algum problema com o Supabase, o sistema ainda possa funcionar através da conexão direta com o PostgreSQL.

Caso precise limpar os dados para iniciar do zero, execute os seguintes SQL no Supabase:

```sql
TRUNCATE detalhes_escala CASCADE;
TRUNCATE escalas CASCADE;
TRUNCATE militares CASCADE;
``` 