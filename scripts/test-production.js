#!/usr/bin/env node

/**
 * Script para simular o ambiente de produção localmente
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Simulando ambiente de produção localmente...');

// Verificar se existe .env.production
const envProdPath = path.join(__dirname, '..', '.env.production');
if (!fs.existsSync(envProdPath)) {
  console.log('⚠️  Arquivo .env.production não encontrado. Criando exemplo...');
  
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envProdPath);
    console.log('📄 Copiado .env.example para .env.production');
    console.log('✏️  Edite o arquivo .env.production com os valores corretos antes de continuar');
    process.exit(1);
  }
}

try {
  console.log('🔨 Executando build...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('🌱 Executando seed...');
  execSync('npm run seed:prod', { stdio: 'inherit' });
  
  console.log('🚀 Iniciando aplicação em modo produção...');
  console.log('📚 Documentação disponível em: http://localhost:3000/api');
  console.log('🏥 Healthcheck disponível em: http://localhost:3000/api');
  
  // Definir variáveis de ambiente para produção local
  process.env.NODE_ENV = 'production';
  process.env.PORT = process.env.PORT || '3000';
  
  execSync('npm run start:prod', { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ Erro durante a simulação:', error.message);
  process.exit(1);
}
