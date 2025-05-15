/**
 * TEMPLATE DE VARIÁVEIS DE AMBIENTE
 * 
 * Este arquivo serve como referência para as variáveis de ambiente necessárias
 * para o funcionamento do Sistema PMF.
 * 
 * Para usar:
 * 1. Copie este arquivo para '.env'
 * 2. Substitua os valores de exemplo pelos valores reais
 * 3. O arquivo .env não é versionado no Git (está no .gitignore)
 */

// Configurações do Supabase
const SUPABASE_URL = 'https://bgyqzowtebcsdujywfom.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXF6b3d0ZWJjc2R1anl3Zm9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzEwMzg2MSwiZXhwIjoyMDYyNjc5ODYxfQ.3f0dM9QTiCo2MY3yX8MbPLL5hjbhtGSoJwo6kejNyII'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXF6b3d0ZWJjc2R1anl3Zm9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDM4NjEsImV4cCI6MjA2MjY3OTg2MX0.Nn1jL9DcUEn5ynB0vjvcxfm1jdJX9od8MVHow0iv7DQ';

// String de conexão PostgreSQL (utilizada como fallback)
const DATABASE_URL = 'postgresql://postgres:postgres@db.bgyqzowtebcsdujywfom.supabase.co:5432/postgres';

// Configurações do servidor
const PORT = 8080;
const NODE_ENV = 'production';

// Configuração para criar dados de exemplo (true/false)
const CREATE_SAMPLE_DATA = true;

/**
 * CONFIGURAÇÃO NO VERCEL - OBRIGATÓRIO PARA PERSISTÊNCIA DOS DADOS
 * 
 * IMPORTANTE: Para garantir que os dados sejam salvos corretamente no Vercel,
 * você PRECISA configurar as variáveis abaixo no dashboard do Vercel.
 * 
 * Passo a passo:
 * 1. Acesse seu projeto no Vercel (https://vercel.com)
 * 2. Vá para "Settings" > "Environment Variables"
 * 3. Adicione TODAS as variáveis abaixo:
 *
 * Nome: SUPABASE_URL
 * Valor: https://bgyqzowtebcsdujywfom.supabase.co
 * 
 * Nome: SUPABASE_SERVICE_KEY
 * Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXF6b3d0ZWJjc2R1anl3Zm9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzEwMzg2MSwiZXhwIjoyMDYyNjc5ODYxfQ.3f0dM9QTiCo2MY3yX8MbPLL5hjbhtGSoJwo6kejNyII
 * 
 * Nome: SUPABASE_ANON_KEY
 * Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXF6b3d0ZWJjc2R1anl3Zm9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDM4NjEsImV4cCI6MjA2MjY3OTg2MX0.Nn1jL9DcUEn5ynB0vjvcxfm1jdJX9od8MVHow0iv7DQ
 * 
 * Nome: DATABASE_URL
 * Valor: postgresql://postgres:postgres@db.bgyqzowtebcsdujywfom.supabase.co:5432/postgres
 * 
 * Nome: CREATE_SAMPLE_DATA
 * Valor: true
 * 
 * 4. IMPORTANTE: Depois de adicionar todas as variáveis, clique em "Save"
 * 5. Vá para "Deployments" e clique em "Redeploy" para aplicar as mudanças
 * 
 * PROBLEMA DE PERSISTÊNCIA:
 * Se os dados não estiverem sendo salvos (desaparecem ao atualizar a página),
 * é porque as variáveis de ambiente não estão configuradas corretamente.
 * 
 * SOLUÇÃO RÁPIDA NO NAVEGADOR:
 * 1. Acesse o sistema no navegador
 * 2. Clique no botão "🛠️ Corrigir Banco" no canto inferior esquerdo da tela
 * 3. Confirme a operação
 * 4. Aguarde o processo terminar e tente adicionar dados novamente
 * 
 * Se o problema persistir, verifique as variáveis de ambiente no Vercel.
 */

module.exports = {
  // Este módulo só existe para referência e não deve ser usado diretamente
  // Use o pacote dotenv para carregar as variáveis do arquivo .env
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  SUPABASE_ANON_KEY,
  DATABASE_URL,
  PORT,
  NODE_ENV,
  CREATE_SAMPLE_DATA
}; 