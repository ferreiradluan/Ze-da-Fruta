#!/usr/bin/env node

/**
 * 🧪 TESTE RÁPIDO - COMPORTAMENTO DE DESENVOLVIMENTO
 * 
 * Este script testa o novo comportamento onde:
 * - DESENVOLVIMENTO: Mostra token como JSON
 * - PRODUÇÃO: Redireciona para o frontend
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function log(message, color = 'white') {
  // Cores simples usando códigos ANSI
  const colors = {
    white: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    rainbow: '\x1b[35m' // usando magenta
  };
  
  const colorCode = colors[color] || colors.white;
  const reset = '\x1b[0m';
  console.log(colorCode + message + reset);
}

function logSection(title) {
  console.log('\n' + '='.repeat(50));
  log(title, 'cyan');
  console.log('='.repeat(50));
}

async function testarEndpoints() {
  logSection('TESTE DOS ENDPOINTS DE AUTENTICAÇÃO');
  
  log('\n📋 INSTRUÇÕES DE TESTE:', 'yellow');
  log('1. Execute este script com o servidor rodando', 'cyan');
  log('2. Abra no navegador: ' + BASE_URL + '/auth/user', 'cyan');
  log('3. Complete o login com Google', 'cyan');
  log('4. Verifique o comportamento:', 'cyan');
  log('   - DESENVOLVIMENTO: Verá JSON com token', 'green');
  log('   - PRODUÇÃO: Será redirecionado para frontend', 'magenta');
  
  // Verificar se servidor está rodando
  try {
    log('\n🔍 Verificando se servidor está ativo...', 'blue');
    const response = await axios.get(`${BASE_URL}/auth/user`, {
      timeout: 5000,
      maxRedirects: 0,
      validateStatus: () => true
    });
    
    if (response.status === 302) {
      log('✅ Servidor ativo e endpoint /auth/user funcionando!', 'green');
      log('🔗 URL de redirecionamento: ' + response.headers.location, 'cyan');
    } else {
      log('⚠️ Resposta inesperada do servidor: ' + response.status, 'yellow');
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log('❌ Servidor não está rodando!', 'red');
      log('💡 Execute: npm start', 'yellow');
    } else {
      log('❌ Erro ao conectar: ' + error.message, 'red');
    }
    return;
  }
  
  logSection('LINKS PARA TESTE MANUAL');
  
  log('🔗 Endpoints para testar no navegador:', 'blue');
  log('   • Usuário: ' + BASE_URL + '/auth/user', 'cyan');
  log('   • Vendedor: ' + BASE_URL + '/auth/vendedor', 'cyan');
  log('   • Entregador: ' + BASE_URL + '/auth/entregador', 'cyan');
  
  logSection('COMPORTAMENTO ESPERADO');
  
  log('🏠 DESENVOLVIMENTO (NODE_ENV !== "production"):', 'green');
  log('   ✅ Callback retorna JSON com token', 'white');
  log('   ✅ Você pode copiar o access_token diretamente', 'white');
  log('   ✅ Inclui instruções de uso', 'white');
  
  log('\n🏭 PRODUÇÃO (NODE_ENV === "production"):', 'magenta');
  log('   ✅ Callback redireciona para ' + 'https://ze-da-fruta-front.vercel.app', 'white');
  log('   ✅ Token é passado na URL para o frontend', 'white');
  log('   ✅ Comportamento integrado com frontend', 'white');
  
  logSection('CONFIGURAÇÃO DO AMBIENTE');
  
  const nodeEnv = process.env.NODE_ENV || 'development';
  log('🔧 NODE_ENV atual: ' + nodeEnv, nodeEnv === 'production' ? 'magenta' : 'green');
  
  if (nodeEnv === 'production') {
    log('⚠️ Você está em modo produção!', 'yellow');
    log('💡 Para testar localmente, execute: NODE_ENV=development npm start', 'cyan');
  } else {
    log('✅ Você está em modo desenvolvimento - perfeito para testes!', 'green');
  }
}

async function main() {
  log('🚀 TESTE DO NOVO COMPORTAMENTO DE AUTENTICAÇÃO', 'rainbow');
  log('   Desenvolvido para ter comportamento diferente em dev/prod', 'gray');
  
  await testarEndpoints();
  
  log('\n✨ Teste concluído!', 'green');
  log('🔗 Para testar, acesse: ' + BASE_URL + '/auth/user', 'cyan');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testarEndpoints };
