#!/usr/bin/env node

// Script de inicialização para produção
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando setup para produção...');

// Verificar se o arquivo do banco existe
const dbPath = process.env.DATABASE_PATH || './ze_da_fruta.sqlite';
const dbExists = fs.existsSync(dbPath);

if (!dbExists) {
  console.log('📦 Banco de dados não encontrado. Criando estrutura inicial...');
  
  try {
    // Se o banco não existir, o TypeORM criará automaticamente com synchronize: true
    // Mas vamos executar o seed para garantir dados iniciais
    console.log('🌱 Executando seed dos dados iniciais...');
    
    // Em produção, o seed deve ser executado após a aplicação estar rodando
    // Por isso, não executamos aqui, mas deixamos um log
    console.log('ℹ️  Execute npm run seed:prod após a primeira inicialização para popular dados.');
  } catch (error) {
    console.error('❌ Erro durante o setup:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Banco de dados encontrado.');
}

console.log('🎉 Setup concluído. Iniciando aplicação...');
