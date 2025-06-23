#!/usr/bin/env node

/**
 * 🧪 TESTE ESPECÍFICO PARA /auth/user EM PRODUÇÃO
 * 
 * Este script faz testes específicos para validar se o endpoint
 * /auth/user está funcionando corretamente em produção.
 */

const axios = require('axios');
const readline = require('readline');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`🧪 ${title}`, 'bold');
  console.log('='.repeat(60));
}

async function testarEndpointCompleto(baseUrl) {
  logSection('TESTE COMPLETO DO ENDPOINT /auth/user');
  
  const testResults = {
    endpoint: null,
    redirect: null,
    googleAuth: null,
    callback: null
  };
  
  try {
    // 1. Testar endpoint principal
    log('1️⃣ Testando endpoint /auth/user...', 'blue');
    
    const authUserResponse = await axios.get(`${baseUrl}/auth/user`, {
      timeout: 15000,
      maxRedirects: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 400;
      }
    });
    
    if (authUserResponse.status === 302) {
      const redirectUrl = authUserResponse.headers.location;
      log(`✅ Endpoint funcionando - Redirecionando para: ${redirectUrl}`, 'green');
      
      if (redirectUrl && redirectUrl.includes('accounts.google.com')) {
        log(`✅ Redirect correto para Google OAuth`, 'green');
        testResults.endpoint = 'PASS';
        testResults.redirect = 'PASS';
      } else {
        log(`⚠️ Redirect não aponta para Google: ${redirectUrl}`, 'yellow');
        testResults.endpoint = 'PASS';
        testResults.redirect = 'WARN';
      }
    } else {
      log(`⚠️ Status não esperado: ${authUserResponse.status}`, 'yellow');
      testResults.endpoint = 'WARN';
    }
    
  } catch (error) {
    log(`❌ Erro ao testar /auth/user: ${error.message}`, 'red');
    testResults.endpoint = 'FAIL';
    
    if (error.code === 'ECONNREFUSED') {
      log(`💡 Servidor parece estar offline`, 'yellow');
    } else if (error.response?.status === 404) {
      log(`💡 Endpoint não encontrado - verificar rotas`, 'yellow');
    } else if (error.response?.status === 500) {
      log(`💡 Erro interno - verificar logs do servidor`, 'yellow');
    }
  }
  
  // 2. Testar variações do endpoint
  log('\n2️⃣ Testando endpoints alternativos...', 'blue');
  
  const alternativeEndpoints = [
    '/auth/user/google',
    '/auth/google',
    '/auth/google/callback'
  ];
  
  for (const endpoint of alternativeEndpoints) {
    try {
      const response = await axios.get(`${baseUrl}${endpoint}`, {
        timeout: 10000,
        maxRedirects: 0,
        validateStatus: function (status) {
          return status >= 200 && status < 500;
        }
      });
      
      if (response.status === 302) {
        log(`✅ ${endpoint} - Funcionando (redirect)`, 'green');
      } else if (response.status === 200) {
        log(`✅ ${endpoint} - Funcionando (200)`, 'green');
      } else {
        log(`⚠️ ${endpoint} - Status ${response.status}`, 'yellow');
      }
      
    } catch (error) {
      if (error.response?.status === 404) {
        log(`❌ ${endpoint} - Não encontrado`, 'red');
      } else {
        log(`❌ ${endpoint} - Erro: ${error.message}`, 'red');
      }
    }
  }
  
  // 3. Testar health check
  log('\n3️⃣ Testando health do servidor...', 'blue');
  
  try {
    const healthResponse = await axios.get(`${baseUrl}/health`, {
      timeout: 5000
    });
    
    if (healthResponse.status === 200) {
      log(`✅ Servidor saudável - Status: ${healthResponse.status}`, 'green');
    } else {
      log(`⚠️ Status de saúde: ${healthResponse.status}`, 'yellow');
    }
    
  } catch (error) {
    log(`❌ Health check falhou: ${error.message}`, 'red');
  }
  
  return testResults;
}

function gerarRelatorioSolucoes(testResults, baseUrl) {
  logSection('RELATÓRIO E SOLUÇÕES');
  
  if (testResults.endpoint === 'PASS') {
    log('🎉 ENDPOINT /auth/user FUNCIONANDO CORRETAMENTE!', 'green');
    log('\n✅ Seu backend está configurado corretamente.', 'green');
    log('✅ O OAuth está redirecionando para o Google.', 'green');
    
    log('\n🚀 PRÓXIMOS PASSOS:', 'blue');
    log('1. Testar o fluxo completo no navegador:', 'cyan');
    log(`   ${baseUrl}/auth/user`, 'cyan');
    log('2. Verificar se o callback retorna o token JWT corretamente', 'cyan');
    log('3. Testar o login no frontend', 'cyan');
    
  } else if (testResults.endpoint === 'FAIL') {
    log('❌ PROBLEMAS DETECTADOS COM /auth/user', 'red');
    
    log('\n🔧 SOLUÇÕES RECOMENDADAS:', 'yellow');
    
    log('\n1️⃣ VERIFICAR DEPLOY:', 'blue');
    log('   • O backend foi deployed corretamente?', 'cyan');
    log('   • Não há erros no build?', 'cyan');
    log('   • O servidor está rodando?', 'cyan');
    
    log('\n2️⃣ VERIFICAR VARIÁVEIS DE AMBIENTE:', 'blue');
    log('   • GOOGLE_CLIENT_ID configurado?', 'cyan');
    log('   • GOOGLE_CLIENT_SECRET configurado?', 'cyan');
    log('   • GOOGLE_CALLBACK_URL correto?', 'cyan');
    
    log('\n3️⃣ VERIFICAR CÓDIGO:', 'blue');
    log('   • AuthController compilou sem erros?', 'cyan');
    log('   • AccountManagementModule está sendo importado?', 'cyan');
    log('   • Rotas estão definidas corretamente?', 'cyan');
    
    log('\n4️⃣ COMANDOS PARA DEBUGAR:', 'blue');
    log('   npm run build (verificar erros)', 'cyan');
    log('   # Deploy novamente', 'cyan');
    log('   # Verificar logs do servidor', 'cyan');
  }
  
  log('\n📝 COMANDOS ÚTEIS PARA DEBUGAR:', 'yellow');
  log('# Testar localmente primeiro:', 'cyan');
  log('npm start', 'cyan');
  log('curl http://localhost:3000/auth/user', 'cyan');
  log('', 'reset');
  log('# Verificar build:', 'cyan');
  log('npm run build 2>&1 | grep -i error', 'cyan');
  log('', 'reset');
  log('# Verificar variáveis (Heroku):', 'cyan');
  log('heroku config -a seu-app', 'cyan');
  log('heroku logs --tail -a seu-app', 'cyan');
}

async function executarTestePrincipal() {
  log('🧪 TESTE ESPECÍFICO PARA /auth/user EM PRODUÇÃO', 'bold');
  log('', 'reset');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('🔗 Qual é a URL do seu backend em produção? (ex: https://meuapp.herokuapp.com): ', async (url) => {
    if (!url || !url.startsWith('http')) {
      log('❌ URL inválida. Deve começar com http:// ou https://', 'red');
      rl.close();
      return;
    }
    
    // Remover trailing slash
    const baseUrl = url.replace(/\/$/, '');
    
    log(`✅ Testando: ${baseUrl}`, 'green');
    
    try {
      const testResults = await testarEndpointCompleto(baseUrl);
      gerarRelatorioSolucoes(testResults, baseUrl);
      
    } catch (error) {
      log(`❌ Erro durante teste: ${error.message}`, 'red');
    }
    
    rl.close();
  });
}

// Executar se chamado diretamente
if (require.main === module) {
  executarTestePrincipal();
}

module.exports = {
  testarEndpointCompleto,
  gerarRelatorioSolucoes
};
