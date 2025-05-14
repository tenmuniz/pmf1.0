const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// URLs e chaves do Supabase
const supabaseUrl = 'https://bgyqzowtebcsdujywfom.supabase.co';

// Utiliza a chave de serviço para operações de banco de dados
// Esta chave permite operações completas no banco de dados
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXF6b3d0ZWJjc2R1anl3Zm9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzEwMzg2MSwiZXhwIjoyMDYyNjc5ODYxfQ.3f0dM9QTiCo2MY3yX8MbPLL5hjbhtGSoJwo6kejNyII';

// Chave anônima para operações do cliente
// Esta chave tem permissões mais restritas, adequada para uso pelo frontend
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXF6b3d0ZWJjc2R1anl3Zm9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDM4NjEsImV4cCI6MjA2MjY3OTg2MX0.Nn1jL9DcUEn5ynB0vjvcxfm1jdJX9od8MVHow0iv7DQ';

// Cria o cliente Supabase com a chave de serviço para operações de backend
const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('Cliente Supabase inicializado com sucesso!');

module.exports = { 
  supabase,
  supabaseUrl,
  serviceRoleKey,
  anonKey 
}; 