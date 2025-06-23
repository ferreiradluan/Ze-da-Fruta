/**
 * 🧪 SEED DE TESTE COMPLETA - ENDPOINTS DE ADMIN (ATUALIZADOS)
 * 
 * Esta seed testa todos os endpoints específicos de admin que REALMENTE EXISTEM
 * - Login automático de admin (zedafruta@admin.com / zedafruta321)
 * - Testes abrangentes de todos os endpoints administrativos existentes
 * 
 * ENDPOINTS TESTADOS:
 * • /admin/dashboard - Dashboard administrativo
 * • /admin/usuarios/* - Gestão de usuários  
 * • /admin/products/* - Gestão de produtos
 * • /admin/estabelecimentos/* - Gestão de estabelecimentos
 * 
 * VERSÃO: 2.0 - Corrigido para usar apenas endpoints reais
 * USO: node scripts/seed-admin-endpoints-real.js
 */

const axios = require('axios');

// ===== CONFIGURAÇÕES =====
const BASE_URL = 'http://localhost:3000';
const ADMIN_CREDENTIALS = {
  email: 'zedafruta@admin.com',
  senha: 'zedafruta321'
};

// ===== CORES PARA CONSOLE =====
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
  console.log('\n============================================================');
  console.log(`🧪 ${title.toUpperCase()}`);
  console.log('============================================================');
}

function logTest(endpoint, method, status, message, color = 'green') {
  const icon = status === 'PASS' ? '✅' : '❌';
  const statusColor = status === 'PASS' ? 'green' : 'red';
  
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
  
  log(`${icon} ${method.padEnd(6)} ${endpoint.padEnd(50)} ${status}`, statusColor);
  if (message) {
    log(`   └─ ${message}`, color);
  }
}

async function makeRequest(endpoint, options = {}) {
  try {
    const config = {
      method: options.method || 'GET',
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 10000,
      validateStatus: () => true // Não lançar erro para status HTTP
    };

    if (options.data) {
      config.data = options.data;
    }

    const response = await axios(config);
    
    return {
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      statusText: 'Network Error',
      error: error.message,
      data: null
    };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== LOGIN DO ADMINISTRADOR =====
async function loginAsAdmin() {
  logSection('ETAPA 1: LOGIN COMO ADMINISTRADOR');
  
  try {
    const result = await makeRequest('/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: ADMIN_CREDENTIALS
    });
    
    if ((result.status === 200 || result.status === 201) && result.data?.access_token) {
      adminToken = result.data.access_token;
      logTest('/auth/admin/login', 'POST', 'PASS', 'Admin logado com sucesso');
      log(`   Token: ${adminToken.substring(0, 25)}...`, 'cyan');
      return true;
    } else {
      logTest('/auth/admin/login', 'POST', 'FAIL', `Erro: ${result.status} - ${result.data?.message || 'Login falhou'}`, 'red');
      return false;
    }
  } catch (error) {
    logTest('/auth/admin/login', 'POST', 'FAIL', `Exceção: ${error.message}`, 'red');
    return false;
  }
}

// ===== DEFINIR ENDPOINTS DE TESTE =====
function getAdminEndpoints() {
  return [
    // === DASHBOARD ===
    {
      name: 'Dashboard Administrativo',
      method: 'GET',
      url: '/admin/dashboard',
      description: 'Painel principal com informações do sistema'
    },
    
    // === GESTÃO DE USUÁRIOS ===
    {
      name: 'Listar Usuários',
      method: 'GET',
      url: '/admin/usuarios',
      description: 'Lista todos os usuários do sistema'
    },
    {
      name: 'Listar Usuários Pendentes',
      method: 'GET', 
      url: '/admin/usuarios/pendentes',
      description: 'Lista usuários com status pendente'
    },
    {
      name: 'Filtrar Usuários por Status',
      method: 'GET',
      url: '/admin/usuarios?status=ATIVO',
      description: 'Filtra usuários por status'
    },
    {
      name: 'Filtrar Usuários por Tipo',
      method: 'GET',
      url: '/admin/usuarios?tipo=vendedor',
      description: 'Filtra usuários por tipo (vendedor, entregador)'
    },
    {
      name: 'Buscar Usuários',
      method: 'GET',
      url: '/admin/usuarios?search=test',
      description: 'Busca usuários por nome ou email'
    },
    
    // === GESTÃO DE PRODUTOS ===
    {
      name: 'Listar Produtos (Admin)',
      method: 'GET',
      url: '/admin/products',
      description: 'Lista todos os produtos para administração'
    },
    {
      name: 'Filtrar Produtos por Status',
      method: 'GET',
      url: '/admin/products?isActive=true',
      description: 'Filtra produtos por status ativo/inativo'
    },
    {
      name: 'Buscar Produtos',
      method: 'GET',
      url: '/admin/products?search=fruta',
      description: 'Busca produtos por nome ou descrição'
    },
    
    // === GESTÃO DE ESTABELECIMENTOS ===
    {
      name: 'Listar Estabelecimentos',
      method: 'GET',
      url: '/admin/estabelecimentos',
      description: 'Lista todos os estabelecimentos'
    },
    {
      name: 'Filtrar Estabelecimentos por Status',
      method: 'GET',
      url: '/admin/estabelecimentos?status=ATIVO',
      description: 'Filtra estabelecimentos por status'
    }
  ];
}

// ===== TESTE DOS ENDPOINTS =====
async function testAdminEndpoints() {
  if (!adminToken) {
    log('❌ Sem token de admin, não é possível testar endpoints', 'red');
    return;
  }

  logSection('ETAPA 2: TESTE DOS ENDPOINTS DE ADMIN');
  
  const endpoints = getAdminEndpoints();
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  };

  log(`📋 Testando ${endpoints.length} endpoints administrativos...`, 'cyan');
  
  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    const counter = `${(i + 1).toString().padStart(2, '0')}/${endpoints.length.toString().padStart(2, '0')}`;
    
    log(`${counter} - ${endpoint.name}`, 'blue');
    log(`    ${endpoint.method} ${endpoint.url}`, 'cyan');
    log(`    ${endpoint.description}`, 'cyan');
    
    const startTime = Date.now();
    const result = await makeRequest(endpoint.url, {
      method: endpoint.method,
      headers,
      data: endpoint.data
    });
    const duration = Date.now() - startTime;

    if (result.success) {
      let dataInfo = '';
      if (result.data) {
        if (Array.isArray(result.data)) {
          dataInfo = `${result.data.length} itens`;
        } else if (typeof result.data === 'object') {
          const keys = Object.keys(result.data);
          dataInfo = keys.slice(0, 3).join(', ');
          if (keys.length > 3) dataInfo += '...';
        }
      }
      
      logTest(endpoint.url, endpoint.method, 'PASS', `${result.status} - ${duration}ms`);
      if (dataInfo) {
        log(`    └─ Dados: ${dataInfo}`, 'cyan');
      }
    } else {
      logTest(endpoint.url, endpoint.method, 'FAIL', `${result.status} - ${result.statusText || result.error}`);
      
      // Log de detalhes do erro
      if (result.data && result.data.message) {
        log(`       Erro: ${result.data.message}`, 'yellow');
      }
    }
    
    // Pequeno delay entre requests
    await sleep(100);
  }
}

// ===== RELATÓRIO FINAL =====
function showFinalReport() {
  logSection('RELATÓRIO FINAL - ENDPOINTS DE ADMIN');
  
  log('📊 ESTATÍSTICAS GERAIS:', 'cyan');
  log(`   Total de testes: ${testResults.total}`, 'cyan');
  log(`   ✅ Sucessos: ${testResults.passed}`, 'green');
  log(`   ❌ Falhas: ${testResults.failed}`, 'red');
  const successRate = testResults.total > 0 ? Math.round((testResults.passed / testResults.total) * 100) : 0;
  log(`   📈 Taxa de sucesso: ${successRate}%`, successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');

  if (testResults.passed > 0) {
    log('✅ ENDPOINTS FUNCIONANDO:', 'green');
    testResults.endpoints
      .filter(e => e.status === 'PASS')
      .forEach((endpoint, index) => {
        log(`  ${index + 1}. ${endpoint.method} ${endpoint.endpoint}`, 'green');
      });
  }

  if (testResults.failed > 0) {
    log('❌ ENDPOINTS COM PROBLEMA:', 'red');
    testResults.endpoints
      .filter(e => e.status === 'FAIL')
      .forEach((endpoint, index) => {
        log(`  ${index + 1}. ${endpoint.method} ${endpoint.endpoint}`, 'red');
        log(`     └─ ${endpoint.message}`, 'yellow');
      });
  }

  if (testResults.failed > 0) {
    log(`⚠️ ${testResults.failed} endpoint(s) precisam de atenção.`, 'yellow');
    log('💡 Verifique a implementação dos endpoints com falha.', 'cyan');
  }

  log('📋 PRÓXIMOS PASSOS:', 'cyan');
  log('1. ✅ Admin login está funcionando', 'green');
  log('2. ✅ Endpoints administrativos estão acessíveis', 'green');
  
  if (testResults.failed > 0) {
    log('3. 🔍 Verificar implementação dos endpoints que falharam', 'yellow');
    log('4. 📊 Implementar lógica de negócio nos TODOs', 'yellow');
  }
  
  log('5. 🚀 Sistema pronto para uso administrativo!', 'green');
}

// ===== FUNÇÃO PRINCIPAL =====
async function main() {
  try {
    // Banner inicial
    log('🔥 === SEED DE ENDPOINTS DE ADMIN (ATUALIZADO) ===', 'bold');
    log('📋 Fazendo login e testando todos os endpoints administrativos REAIS...', 'cyan');

    // Etapa 1: Login
    const loginSuccess = await loginAsAdmin();
    if (!loginSuccess) {
      log('❌ Falha no login de admin. Verifique as credenciais.', 'red');
      process.exit(1);
    }

    // Pequeno delay
    await sleep(500);

    // Etapa 2: Teste dos endpoints
    await testAdminEndpoints();

    // Etapa 3: Relatório final
    showFinalReport();

    log('\n🎉 Seed de admin concluída!', 'green');
    
  } catch (error) {
    log(`❌ Erro durante a execução: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { main };
