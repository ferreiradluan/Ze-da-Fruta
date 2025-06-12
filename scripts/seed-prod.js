#!/usr/bin/env node

/**
 * Script de seed para produção
 * Este script inicializa o banco de dados com dados essenciais
 */

console.log('🌱 Iniciando seed de produção...');

const fs = require('fs');
const path = require('path');

// Função para criar o banco SQLite com dados iniciais
async function createProductionDatabase() {
  try {
    const dbPath = process.env.DATABASE_PATH || './ze_da_fruta.sqlite';
    const dbDir = path.dirname(dbPath);
    
    // Criar diretório se não existir
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    console.log(`📁 Banco será criado em: ${dbPath}`);
    
    // Importar dinamicamente o TypeORM
    const { DataSource } = require('typeorm');
    
    // Configuração do banco para produção
    const dataSource = new DataSource({
      type: 'sqlite',
      database: dbPath,
      entities: [
        'dist/**/*.entity.js'
      ],
      synchronize: true,
      logging: false,
    });

    await dataSource.initialize();
    console.log('✅ Banco de dados inicializado');

    // Criar dados iniciais básicos
    await createInitialData(dataSource);
    
    await dataSource.destroy();
    console.log('🎉 Seed de produção concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no seed de produção:', error);
    process.exit(1);
  }
}

async function createInitialData(dataSource) {
  console.log('📊 Criando dados iniciais...');
  
  // Você pode adicionar dados específicos aqui
  // Por enquanto, apenas garantimos que as tabelas foram criadas
  
  console.log('✅ Dados iniciais criados');
}

// Executar o seed
createProductionDatabase();
