#!/usr/bin/env node

/**
 * 🧪 SEED DE TESTE COMPLETA - Zé da Fruta Backend
 * 
 * ✅ Testa TODOS os endpoints do sistema
 * ✅ Login automático de admin (credenciais padrão)
 * ✅ Solicita apenas token de usuário manualmente
 * ✅ Aprovação automática pelo admin
 * ✅ Teste de todos os endpoints de monitoramento
 * ✅ Teste de todos os endpoints de admin
 * ✅ Relatório completo de status
 */

const axios = require('axios');
const readline = require('readline');

// ===== CONFIGURAÇÃO =====
const BASE_URL = 'http://localhost:3000';

// ===== CORES PARA OUTPUT =====
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// ===== ESTADO GLOBAL =====
let adminToken = null;
let userToken = null;
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  endpoints: []
};

// ===== UTILITÁRIOS =====
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`🧪 ${title}`, 'bold');
  console.log('='.repeat(60));
}

function logTest(endpoint, method, status, message, color = 'green') {
  const statusIcon = status === 'PASS' ? '✅' : '❌';
  log(`${statusIcon} ${method.padEnd(6)} ${endpoint.padEnd(40)} ${status}`, color);
  if (message) {
    log(`   └─ ${message}`, 'cyan');
  }
  
  testResults.total++;
  if (status === 'PASS') {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
  
  testResults.endpoints.push({
    endpoint,
    method,
    status,
    message
  });
}

async function makeRequest(endpoint, options = {}) {
  try {
    const config = {
      timeout: 10000,
      ...options,
      url: `${BASE_URL}${endpoint}`,
      validateStatus: () => true // Aceita qualquer status code
    };
    
    const response = await axios(config);
    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    return {
      status: 0,
      statusText: 'NETWORK_ERROR',
      data: null,
      error: error.message
    };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== LOGIN AUTOMÁTICO DE ADMIN =====
async function autoLoginAdmin() {
  logSection('LOGIN AUTOMÁTICO DE ADMINISTRADOR');
  
  log('🔐 Fazendo login automático com admin padrão...', 'cyan');
  
  const loginData = {
    email: 'zedafruta@admin.com',
    senha: 'zedafruta321'
  };
  
  try {
    const loginResult = await makeRequest('/auth/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: loginData
    });
    
    if (loginResult.status === 200 && loginResult.data?.access_token) {
      adminToken = loginResult.data.access_token;
      const adminInfo = loginResult.data.admin;
      
      logTest('/auth/admin/login', 'POST', 'PASS', 
        `Login realizado: ${adminInfo?.nome || 'Admin'} (${adminInfo?.email || loginData.email})`);
      log(`🔑 Token de admin configurado: ${adminToken.substring(0, 20)}...`, 'green');
      return true;
    } else if (loginResult.status === 401) {
      logTest('/auth/admin/login', 'POST', 'FAIL', 'Credenciais de admin inválidas', 'red');
      log('❌ Verifique se o admin padrão foi criado no banco', 'red');
      return false;
    } else if (loginResult.status === 0) {
      logTest('/auth/admin/login', 'POST', 'FAIL', `Erro de rede: ${loginResult.error}`, 'red');
      return false;
    } else {
      logTest('/auth/admin/login', 'POST', 'FAIL', 
        `Status: ${loginResult.status} - ${loginResult.statusText}`, 'red');
      return false;
    }
  } catch (error) {
    logTest('/auth/admin/login', 'POST', 'FAIL', `Erro: ${error.message}`, 'red');
    return false;
  }
}

async function createTestUser() {
  logSection('CRIAÇÃO DE USUÁRIO DE TESTE');
  
  // Simular criação de usuário via Google OAuth (seria normalmente um redirect)
  log('⚠️  Usuário de teste deve ser criado manualmente via Google OAuth', 'yellow');
  log('   Para testes completos, acesse: http://localhost:3000/auth/user', 'cyan');
  
  return await promptUserToken();
}

async function promptUserToken() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    log('\n📝 Por favor, forneça um token de usuário para testes:', 'yellow');
    log('   1. Acesse http://localhost:3000/auth/user em outro terminal/browser', 'cyan');
    log('   2. Complete o login com Google', 'cyan');
    log('   3. Copie o token JWT gerado', 'cyan');
    log('   4. Cole o token aqui (ou pressione Enter para pular testes de usuário)', 'cyan');
    
    rl.question('\nToken do usuário: ', (token) => {
      if (token.trim()) {
        userToken = token.trim();
        log('✅ Token do usuário configurado', 'green');
      } else {
        log('⚠️  Testes de usuário serão pulados', 'yellow');
      }
      rl.close();
      resolve(token.trim() ? true : false);
    });
  });
}

// ===== TESTES DE MONITORAMENTO =====
async function testMonitoringEndpoints() {
  logSection('ENDPOINTS DE MONITORAMENTO');
  
  const endpoints = [
    { path: '/monitoring/health', method: 'GET', description: 'Health check básico' },
    { path: '/monitoring/health/domains', method: 'GET', description: 'Health por domínios' },
    { path: '/monitoring/health/sales', method: 'GET', description: 'Health vendas' },
    { path: '/monitoring/health/accounts', method: 'GET', description: 'Health contas' },
    { path: '/monitoring/metrics', method: 'GET', description: 'Métricas consolidadas' },
    { path: '/monitoring/metrics/reset', method: 'GET', description: 'Reset métricas (dev)' }
  ];
  
  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.path, {
      method: endpoint.method
    });
    
    if (result.status >= 200 && result.status < 300) {
      logTest(endpoint.path, endpoint.method, 'PASS', endpoint.description);
    } else if (result.status === 0) {
      logTest(endpoint.path, endpoint.method, 'FAIL', `Erro de rede: ${result.error}`, 'red');
    } else {
      logTest(endpoint.path, endpoint.method, 'FAIL', `Status: ${result.status} - ${result.statusText}`, 'red');
    }
    
    await sleep(100); // Pequena pausa entre requests
  }
}

async function testHealthEndpoints() {
  logSection('ENDPOINTS DE HEALTH (Alternativos)');
  
  const endpoints = [
    { path: '/health', method: 'GET', description: 'Health check rápido' },
    { path: '/health/detailed', method: 'GET', description: 'Health detalhado' },
    { path: '/health/sales', method: 'GET', description: 'Health específico vendas' },
    { path: '/health/accounts', method: 'GET', description: 'Health específico contas' },
    { path: '/health/metrics', method: 'GET', description: 'Métricas de domínio' },
    { path: '/health/system', method: 'GET', description: 'Métricas de sistema' },
    { path: '/health/system/status', method: 'GET', description: 'Status de saúde do sistema' },
    { path: '/health/prometheus', method: 'GET', description: 'Métricas formato Prometheus' }
  ];
  
  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.path, {
      method: endpoint.method
    });
    
    if (result.status >= 200 && result.status < 300) {
      logTest(endpoint.path, endpoint.method, 'PASS', endpoint.description);
    } else if (result.status === 0) {
      logTest(endpoint.path, endpoint.method, 'FAIL', `Erro de rede: ${result.error}`, 'red');
    } else {
      logTest(endpoint.path, endpoint.method, 'FAIL', `Status: ${result.status} - ${result.statusText}`, 'red');
    }
    
    await sleep(100);
  }
}

// ===== TESTES DE ADMIN =====
async function testAdminEndpoints() {
  if (!adminToken) {
    log('⚠️  Token de admin não disponível, pulando testes administrativos', 'yellow');
    return;
  }
  
  logSection('ENDPOINTS ADMINISTRATIVOS');
  
  const endpoints = [
    // Dashboard
    { path: '/admin/dashboard', method: 'GET', description: 'Dashboard administrativo' },
    
    // Usuários
    { path: '/admin/usuarios', method: 'GET', description: 'Listar todos os usuários' },
    { path: '/admin/usuarios/pendentes', method: 'GET', description: 'Listar usuários pendentes' },
    { path: '/admin/usuarios?status=ATIVO', method: 'GET', description: 'Filtrar usuários ativos' },
    { path: '/admin/usuarios?status=PENDENTE', method: 'GET', description: 'Filtrar usuários pendentes' },
    { path: '/admin/usuarios?roles=USER', method: 'GET', description: 'Filtrar por role USER' },
    { path: '/admin/usuarios?search=test', method: 'GET', description: 'Buscar usuários por nome/email' },
    
    // Produtos
    { path: '/admin/products', method: 'GET', description: 'Listar todos os produtos' },
    { path: '/admin/products?ativo=true', method: 'GET', description: 'Filtrar produtos ativos' },
    { path: '/admin/products?categoria=frutas', method: 'GET', description: 'Filtrar por categoria' }
  ];
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  };
  
  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.path, {
      method: endpoint.method,
      headers
    });
    
    if (result.status >= 200 && result.status < 300) {
      logTest(endpoint.path, endpoint.method, 'PASS', endpoint.description);
    } else if (result.status === 401) {
      logTest(endpoint.path, endpoint.method, 'FAIL', 'Token inválido ou expirado', 'red');
    } else if (result.status === 403) {
      logTest(endpoint.path, endpoint.method, 'FAIL', 'Sem permissão de admin', 'red');
    } else if (result.status === 0) {
      logTest(endpoint.path, endpoint.method, 'FAIL', `Erro de rede: ${result.error}`, 'red');
    } else {
      logTest(endpoint.path, endpoint.method, 'FAIL', `Status: ${result.status} - ${result.statusText}`, 'red');
    }
    
    await sleep(100);
  }
}

// ===== TESTES DE USUÁRIO =====
async function testUserEndpoints() {
  if (!userToken) {
    log('⚠️  Token de usuário não disponível, pulando testes de usuário', 'yellow');
    return;
  }
  
  logSection('ENDPOINTS DE USUÁRIO');
  
  const endpoints = [
    { path: '/account/profile/me', method: 'GET', description: 'Obter meu perfil' },
    { path: '/sales/public/products', method: 'GET', description: 'Listar produtos públicos' },
    { path: '/sales/public/categories', method: 'GET', description: 'Listar categorias públicas' },
    { path: '/sales/public/establishments', method: 'GET', description: 'Listar estabelecimentos' }
  ];
  
  const headers = {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  };
  
  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.path, {
      method: endpoint.method,
      headers
    });
    
    if (result.status >= 200 && result.status < 300) {
      logTest(endpoint.path, endpoint.method, 'PASS', endpoint.description);
    } else if (result.status === 401) {
      logTest(endpoint.path, endpoint.method, 'FAIL', 'Token inválido ou usuário pendente', 'red');
    } else if (result.status === 0) {
      logTest(endpoint.path, endpoint.method, 'FAIL', `Erro de rede: ${result.error}`, 'red');
    } else {
      logTest(endpoint.path, endpoint.method, 'FAIL', `Status: ${result.status} - ${result.statusText}`, 'red');
    }
    
    await sleep(100);
  }
}

// ===== TESTES DE APROVAÇÃO DE USUÁRIO =====
async function testUserApproval() {
  if (!adminToken || !userToken) {
    log('⚠️  Tokens não disponíveis, pulando teste de aprovação', 'yellow');
    return;
  }
  
  logSection('PROCESSO DE APROVAÇÃO DE USUÁRIO');
  
  // Primeiro, tentar obter info do usuário atual
  const userInfo = await makeRequest('/account/profile/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  if (userInfo.status === 200 && userInfo.data?.id) {
    const userId = userInfo.data.id;
    log(`👤 Usuário identificado: ${userInfo.data.nome || userInfo.data.email}`, 'cyan');
    
    // Tentar aprovar o usuário
    const approval = await makeRequest(`/admin/usuarios/${userId}/aprovar`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (approval.status >= 200 && approval.status < 300) {
      logTest(`/admin/usuarios/${userId}/aprovar`, 'PUT', 'PASS', 'Usuário aprovado com sucesso');
    } else {
      logTest(`/admin/usuarios/${userId}/aprovar`, 'PUT', 'FAIL', `Status: ${approval.status}`, 'red');
    }
  } else if (userInfo.status === 401) {
    log('⚠️  Usuário provavelmente está com status PENDENTE', 'yellow');
    
    // Listar usuários pendentes para encontrar o usuário
    const pendingUsers = await makeRequest('/admin/usuarios/pendentes', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (pendingUsers.status === 200 && pendingUsers.data?.length > 0) {
      log(`📋 Encontrados ${pendingUsers.data.length} usuários pendentes`, 'cyan');
      
      // Tentar aprovar o primeiro usuário pendente
      const firstPendingUser = pendingUsers.data[0];
      const approval = await makeRequest(`/admin/usuarios/${firstPendingUser.id}/aprovar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (approval.status >= 200 && approval.status < 300) {
        logTest(`/admin/usuarios/${firstPendingUser.id}/aprovar`, 'PUT', 'PASS', 'Usuário pendente aprovado');
      } else {
        logTest(`/admin/usuarios/${firstPendingUser.id}/aprovar`, 'PUT', 'FAIL', `Status: ${approval.status}`, 'red');
      }
    }
  }
}

// ===== TESTES PÚBLICOS =====
async function testPublicEndpoints() {
  logSection('ENDPOINTS PÚBLICOS');
  
  const endpoints = [
    { path: '/sales/public/products', method: 'GET', description: 'Produtos públicos' },
    { path: '/sales/public/categories', method: 'GET', description: 'Categorias públicas' },
    { path: '/sales/public/establishments', method: 'GET', description: 'Estabelecimentos públicos' }
  ];
  
  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.path, {
      method: endpoint.method
    });
    
    if (result.status >= 200 && result.status < 300) {
      logTest(endpoint.path, endpoint.method, 'PASS', endpoint.description);
    } else if (result.status === 0) {
      logTest(endpoint.path, endpoint.method, 'FAIL', `Erro de rede: ${result.error}`, 'red');
    } else {
      logTest(endpoint.path, endpoint.method, 'FAIL', `Status: ${result.status} - ${result.statusText}`, 'red');
    }
    
    await sleep(100);
  }
}

// ===== RELATÓRIO FINAL =====
function generateReport() {
  logSection('RELATÓRIO FINAL DE TESTES');
  
  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  
  log(`📊 Estatísticas Gerais:`, 'bold');
  log(`   Total de testes: ${testResults.total}`, 'cyan');
  log(`   ✅ Aprovados: ${testResults.passed}`, 'green');
  log(`   ❌ Falharam: ${testResults.failed}`, 'red');
  log(`   📈 Taxa de sucesso: ${passRate}%`, passRate >= 80 ? 'green' : passRate >= 60 ? 'yellow' : 'red');
  
  if (testResults.failed > 0) {
    log(`\n🔍 Endpoints com falha:`, 'yellow');
    testResults.endpoints
      .filter(e => e.status === 'FAIL')
      .forEach(e => {
        log(`   ❌ ${e.method} ${e.endpoint} - ${e.message}`, 'red');
      });
  }
  
  log(`\n💡 Recomendações:`, 'cyan');
  if (!adminToken) {
    log(`   • Verifique se o admin padrão está configurado corretamente`, 'yellow');
  }
  if (!userToken) {
    log(`   • Configure um usuário de teste via Google OAuth para testes completos`, 'yellow');
  }
  if (testResults.failed > 0) {
    log(`   • Verifique se o servidor está rodando na porta 3000`, 'yellow');
    log(`   • Confirme se todas as migrações do banco foram executadas`, 'yellow');
    log(`   • Verifique os logs do servidor para mais detalhes`, 'yellow');
  }
  
  log(`\n🎯 Resultado geral: ${passRate >= 80 ? '✅ EXCELENTE' : passRate >= 60 ? '⚠️  BOM' : '❌ NECESSITA MELHORIAS'}`, 
      passRate >= 80 ? 'green' : passRate >= 60 ? 'yellow' : 'red');
}

// ===== FUNÇÃO PRINCIPAL =====
async function runAllTests() {
  log('🚀 Iniciando Seed de Teste Completa - Zé da Fruta Backend', 'bold');
  log(`🔗 URL Base: ${BASE_URL}`, 'cyan');
  log(`⏰ Timestamp: ${new Date().toISOString()}`, 'cyan');
  
  try {
    // 1. Login automático de Admin
    const adminSuccess = await autoLoginAdmin();
    if (!adminSuccess) {
      log('⚠️  Continuando sem token de admin - alguns testes serão pulados', 'yellow');
    }
    
    // 2. Configuração de usuário de teste
    await createTestUser();
    
    // 3. Testes de monitoramento (principais)
    await testMonitoringEndpoints();
    
    // 4. Testes de health (alternativos)
    await testHealthEndpoints();
    
    // 5. Testes públicos
    await testPublicEndpoints();
    
    // 6. Testes administrativos
    await testAdminEndpoints();
    
    // 7. Processo de aprovação
    await testUserApproval();
    
    // 8. Testes de usuário
    await testUserEndpoints();
    
    // 9. Relatório final
    generateReport();
    
  } catch (error) {
    log(`💥 Erro crítico durante os testes: ${error.message}`, 'red');
    process.exit(1);
  }
}

// ===== VERIFICAÇÃO INICIAL =====
async function checkServerHealth() {
  log('🔍 Verificando se o servidor está online...', 'cyan');
  
  const healthCheck = await makeRequest('/health');
  
  if (healthCheck.status === 200) {
    log('✅ Servidor está online e respondendo', 'green');
    return true;
  } else {
    log('❌ Servidor não está respondendo na porta 3000', 'red');
    log('   Certifique-se de que o servidor está rodando: npm run start:dev', 'yellow');
    return false;
  }
}

// ===== EXECUÇÃO =====
async function main() {
  const serverOnline = await checkServerHealth();
  
  if (!serverOnline) {
    process.exit(1);
  }
  
  await runAllTests();
}

// Executar se for chamado diretamente
if (require.main === module) {
  main().catch(error => {
    log(`💥 Erro fatal: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  autoLoginAdmin,
  testMonitoringEndpoints,
  testAdminEndpoints,
  testUserEndpoints
};
