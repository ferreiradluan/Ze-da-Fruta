console.log('🌱 Executando seed simples...');

// Script simples que apenas confirma que o sistema está funcionando
const fs = require('fs');
const path = require('path');

try {
  const dbPath = process.env.DATABASE_PATH || './ze_da_fruta.sqlite';
  const dbDir = path.dirname(dbPath);
  
  // Criar diretório se necessário
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`📁 Diretório ${dbDir} criado`);
  }
  
  console.log(`📍 Banco configurado para: ${dbPath}`);
  console.log('✅ Seed executado com sucesso!');
  console.log('ℹ️  As tabelas e dados serão criados automaticamente quando a aplicação iniciar');
  
} catch (error) {
  console.error('❌ Erro no seed:', error);
  process.exit(1);
}