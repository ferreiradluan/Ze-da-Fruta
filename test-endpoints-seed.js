#!/usr/bin/env node

/**
 * 🧪 SEED DE TESTE COMPLETA - ENDPOINTS DO SISTEMA - PRODUÇÃO
 * 
 * ✅ Testa todos os endpoints importantes do sistema
 * ✅ Popula banco de dados via APIs REST em PRODUÇÃO
 * ✅ Identifica endpoints quebrados ou com problemas
 * ✅ Relatório detalhado de funcionamento
 * ✅ Usa autenticação admin para acesso completo
 * 
 * USO: npm run test:endpoints
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuração - PRODUÇÃO
const BASE_URL = 'https://meu-ze-da-fruta-backend-8c4976f28553.herokuapp.com';
const ADMIN_CREDENTIALS = {
  email: 'zedafruta@admin.com', // Credenciais corretas de produção
  senha: 'zedafruta321' // Senha correta de produção
};

let adminToken = null;
const testResults = [];
const brokenEndpoints = [];
const workingEndpoints = [];

// Função para log colorido
function log(type, message, data = null) {
  const colors = {
    success: '\x1b[32m✅',
    error: '\x1b[31m❌',
    warning: '\x1b[33m⚠️',
    info: '\x1b[36mℹ️',
    test: '\x1b[35m🧪',
    section: '\x1b[36m📋'
  };
  
  console.log(`${colors[type]} ${message}\x1b[0m`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  
  // Salvar resultado do teste
  testResults.push({
    type,
    message,
    data: data || null,
    timestamp: new Date().toISOString()
  });
}

// Função para fazer requisições
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
      validateStatus: () => true // Aceitar todos os status codes
    };

    if (options.data) {
      config.data = options.data;
    }

    const response = await axios(config);
    return {
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message,
      data: null
    };
  }
}

// Função para testar endpoint
function testEndpoint(endpoint, method, status, description, type = 'info') {
  const emoji = status >= 200 && status < 300 ? '✅' : 
                status >= 400 && status < 500 ? '⚠️' : '❌';
  
  const result = {
    endpoint,
    method,
    status,
    description,
    working: status >= 200 && status < 400
  };

  if (result.working) {
    workingEndpoints.push(result);
  } else {
    brokenEndpoints.push(result);
  }

  console.log(`${emoji} ${method} ${endpoint} - ${status} - ${description}`);
}

// Seção de log
function logSection(title) {
  console.log('\n' + '='.repeat(80));
  console.log(`📋 ${title}`);
  console.log('='.repeat(80));
}

// ===== 1. LOGIN COMO ADMIN =====
async function loginAsAdmin() {
  logSection('ETAPA 1: LOGIN COMO ADMINISTRADOR');
  
  try {
    const result = await makeRequest('/auth/admin/login', {
      method: 'POST',
      data: ADMIN_CREDENTIALS
    });
    
    if (result.status === 200 && result.data?.access_token) {
      adminToken = result.data.access_token;
      testEndpoint('/auth/admin/login', 'POST', result.status, 'Login de admin realizado com sucesso');
      log('success', `Token de admin obtido: ${adminToken.substring(0, 25)}...`);
      return true;
    } else {
      testEndpoint('/auth/admin/login', 'POST', result.status, `Falha no login: ${result.data?.message || 'Erro desconhecido'}`);
      log('error', 'Falha no login de admin', result.data);
      return false;
    }
  } catch (error) {
    testEndpoint('/auth/admin/login', 'POST', 0, `Exceção: ${error.message}`);
    log('error', 'Erro ao fazer login', error.message);
    return false;
  }
}

// ===== 2. TESTAR ENDPOINTS PÚBLICOS =====
async function testPublicEndpoints() {
  logSection('ETAPA 2: TESTANDO ENDPOINTS PÚBLICOS');
  
  const publicEndpoints = [
    { path: '/health', method: 'GET', description: 'Health check do sistema' },
    { path: '/sales/categorias', method: 'GET', description: 'Listar categorias' },
    { path: '/sales/produtos', method: 'GET', description: 'Listar produtos disponíveis' },
    { path: '/sales/estabelecimentos', method: 'GET', description: 'Listar estabelecimentos' },
  ];

  for (const endpoint of publicEndpoints) {
    try {
      const result = await makeRequest(endpoint.path, { method: endpoint.method });
      testEndpoint(endpoint.path, endpoint.method, result.status, endpoint.description);
      
      if (result.status >= 200 && result.status < 300) {
        log('success', `${endpoint.description}: ${result.data?.length || 0} itens encontrados`);
      } else {
        log('warning', `${endpoint.description}: ${result.data?.message || 'Erro'}`);
      }
    } catch (error) {
      testEndpoint(endpoint.path, endpoint.method, 0, `Exceção: ${error.message}`);
    }
  }
}

// ===== 3. TESTAR ENDPOINTS DE ADMIN =====
async function testAdminEndpoints() {
  logSection('ETAPA 3: TESTANDO ENDPOINTS ADMINISTRATIVOS');
  
  if (!adminToken) {
    log('error', 'Token de admin não disponível, pulando testes administrativos');
    return;
  }

  const headers = { 'Authorization': `Bearer ${adminToken}` };
  
  const adminEndpoints = [
    // Dashboard
    { path: '/admin/dashboard', method: 'GET', description: 'Dashboard administrativo' },
    
    // Usuários
    { path: '/admin/usuarios', method: 'GET', description: 'Listar todos os usuários' },
    { path: '/admin/usuarios/pendentes', method: 'GET', description: 'Listar usuários pendentes' },
    
    // Produtos  
    { path: '/admin/products', method: 'GET', description: 'Listar todos os produtos (admin)' },
    
    // Estabelecimentos
    { path: '/admin/estabelecimentos', method: 'GET', description: 'Listar estabelecimentos (admin)' },
  ];

  for (const endpoint of adminEndpoints) {
    try {
      const result = await makeRequest(endpoint.path, { 
        method: endpoint.method, 
        headers 
      });
      testEndpoint(endpoint.path, endpoint.method, result.status, endpoint.description);
      
      if (result.status >= 200 && result.status < 300) {
        log('success', `${endpoint.description}: Sucesso`);
      } else {
        log('warning', `${endpoint.description}: ${result.data?.message || 'Erro'}`);
      }
    } catch (error) {
      testEndpoint(endpoint.path, endpoint.method, 0, `Exceção: ${error.message}`);
    }
  }
}

// ===== 4. POPULAR BANCO VIA ENDPOINTS =====
async function populateDatabaseViaEndpoints() {
  logSection('ETAPA 4: POPULANDO BANCO VIA ENDPOINTS');
  
  if (!adminToken) {
    log('error', 'Token de admin não disponível, não é possível popular banco');
    return;
  }

  const headers = { 'Authorization': `Bearer ${adminToken}` };

  // 4.1 Criar Estabelecimento
  log('info', 'Criando estabelecimento via endpoint...');
  try {
    const estabelecimentoData = {
      nome: 'Hortifruti Teste API',
      cnpj: '12345678000199',
      endereco: 'Rua Teste, 123',
      telefone: '(11) 99999-9999',
      email: 'teste@hortifruti.com',
      descricao: 'Estabelecimento criado via API'
    };

    const result = await makeRequest('/admin/estabelecimentos', {
      method: 'POST',
      headers,
      data: estabelecimentoData
    });

    testEndpoint('/admin/estabelecimentos', 'POST', result.status, 'Criar estabelecimento via API');
    if (result.status >= 200 && result.status < 300) {
      log('success', 'Estabelecimento criado com sucesso', result.data);
    } else {
      log('warning', 'Falha ao criar estabelecimento', result.data);
    }
  } catch (error) {
    testEndpoint('/admin/estabelecimentos', 'POST', 0, `Exceção: ${error.message}`);
  }

  // 4.2 Criar Produtos
  log('info', 'Criando produtos via endpoint...');
  const produtos = [
    {
      nome: 'Maçã Gala',
      preco: 5.99,
      descricao: 'Maçã Gala fresca',
      unidadeMedida: 'kg',
      estoque: 50,
      ativo: true,
      disponivel: true
    },
    {
      nome: 'Banana Prata',
      preco: 3.50,
      descricao: 'Banana Prata doce',
      unidadeMedida: 'kg',
      estoque: 30,
      ativo: true,
      disponivel: true
    }
  ];

  for (const produto of produtos) {
    try {
      const result = await makeRequest('/admin/products', {
        method: 'POST',
        headers,
        data: produto
      });

      testEndpoint('/admin/products', 'POST', result.status, `Criar produto: ${produto.nome}`);
      if (result.status >= 200 && result.status < 300) {
        log('success', `Produto ${produto.nome} criado com sucesso`);
      } else {
        log('warning', `Falha ao criar produto ${produto.nome}`, result.data);
      }
    } catch (error) {
      testEndpoint('/admin/products', 'POST', 0, `Exceção ao criar ${produto.nome}: ${error.message}`);
    }
  }
}

// ===== 5. TESTAR FUNCIONALIDADES CRÍTICAS =====
async function testCriticalFunctionalities() {
  logSection('ETAPA 5: TESTANDO FUNCIONALIDADES CRÍTICAS');
  
  // 5.1 Testar listagem de produtos após população
  try {
    const result = await makeRequest('/sales/produtos');
    testEndpoint('/sales/produtos', 'GET', result.status, 'Listar produtos após população');
    
    if (result.status === 200 && result.data?.length > 0) {
      log('success', `Produtos listados com sucesso: ${result.data.length} produtos encontrados`);
    } else if (result.status === 200 && result.data?.length === 0) {
      log('warning', 'Endpoint funciona mas não há produtos no banco');
    } else {
      log('error', 'Falha ao listar produtos', result.data);
    }
  } catch (error) {
    testEndpoint('/sales/produtos', 'GET', 0, `Exceção: ${error.message}`);
  }

  // 5.2 Testar autenticação Google (simulação)
  try {
    const result = await makeRequest('/auth/google/simulate', {
      method: 'POST',
      data: {
        profile: {
          id: 'test123',
          displayName: 'Usuário Teste',
          emails: [{ value: 'teste@gmail.com' }],
          photos: [{ value: 'https://example.com/photo.jpg' }]
        },
        tipoUsuario: 'user'
      }
    });
    
    testEndpoint('/auth/google/simulate', 'POST', result.status, 'Simulação de login Google');
  } catch (error) {
    testEndpoint('/auth/google/simulate', 'POST', 0, `Exceção: ${error.message}`);
  }
}

// ===== 6. RELATÓRIO FINAL =====
function generateFinalReport() {
  logSection('RELATÓRIO FINAL DE TESTES');
  
  console.log(`\n📊 ESTATÍSTICAS:`);
  console.log(`   ✅ Endpoints funcionando: ${workingEndpoints.length}`);
  console.log(`   ❌ Endpoints com problemas: ${brokenEndpoints.length}`);
  console.log(`   📋 Total de endpoints testados: ${workingEndpoints.length + brokenEndpoints.length}`);

  if (workingEndpoints.length > 0) {
    console.log(`\n✅ ENDPOINTS FUNCIONANDO:`);
    workingEndpoints.forEach(ep => {
      console.log(`   ${ep.method} ${ep.endpoint} - ${ep.description}`);
    });
  }

  if (brokenEndpoints.length > 0) {
    console.log(`\n❌ ENDPOINTS COM PROBLEMAS:`);
    brokenEndpoints.forEach(ep => {
      console.log(`   ${ep.method} ${ep.endpoint} - Status: ${ep.status} - ${ep.description}`);
    });
  }

  // Salvar relatório em arquivo
  const reportPath = path.join(__dirname, 'test-endpoints-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      working: workingEndpoints.length,
      broken: brokenEndpoints.length,
      total: workingEndpoints.length + brokenEndpoints.length
    },
    workingEndpoints,
    brokenEndpoints,
    allResults: testResults
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log('success', `Relatório salvo em: ${reportPath}`);

  // Recomendações
  console.log(`\n🔧 RECOMENDAÇÕES:`);
  if (brokenEndpoints.length > 0) {
    console.log(`   1. Verificar endpoints com problemas listados acima`);
    console.log(`   2. Implementar endpoints faltantes`);
    console.log(`   3. Corrigir problemas de autenticação/autorização`);
  }
  console.log(`   4. Verificar se o banco foi populado corretamente`);
  console.log(`   5. Executar 'npm run seed:verify' para validar dados`);
}

// ===== FUNÇÃO PRINCIPAL =====
async function main() {
  console.log('🚀 INICIANDO SEED DE TESTE COM ENDPOINTS DO SISTEMA\n');
  
  try {
    // Etapa 1: Login como admin
    const loginSuccess = await loginAsAdmin();
    if (!loginSuccess) {
      log('error', 'Não foi possível fazer login como admin. Verifique as credenciais.');
      log('info', 'Execute: node scripts/setup-admin.js para criar o admin');
      return;
    }

    // Etapa 2: Testar endpoints públicos
    await testPublicEndpoints();

    // Etapa 3: Testar endpoints administrativos
    await testAdminEndpoints();

    // Etapa 4: Popular banco via endpoints
    await populateDatabaseViaEndpoints();

    // Etapa 5: Testar funcionalidades críticas
    await testCriticalFunctionalities();

    // Etapa 6: Relatório final
    generateFinalReport();

    log('success', 'Seed de teste concluída com sucesso!');
    
  } catch (error) {
    log('error', 'Erro durante execução da seed', error.message);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = { main, loginAsAdmin, testPublicEndpoints, testAdminEndpoints };
async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 'NETWORK_ERROR'
    };
  }
}

// 1. Fazer login como admin
async function loginAsAdmin() {
  log('test', 'Tentando fazer login como admin...');
  
  const result = await makeRequest('POST', '/auth/admin/login', ADMIN_CREDENTIALS);
  if (result.success && result.data.access_token) {
    adminToken = result.data.access_token;
    log('success', 'Login admin realizado com sucesso!');
    return true;
  } else {
    log('error', 'Falha no login admin', { 
      result: result,
      credentials: ADMIN_CREDENTIALS 
    });
    return false;
  }
}

// 2. Testar endpoints de produtos
async function testProductEndpoints() {
  if (!adminToken) return false;
  
  const headers = { 'Authorization': `Bearer ${adminToken}` };
  
  log('test', '🛍️ Testando endpoints de produtos...');
  
  // 2.1 Listar produtos (endpoint público)
  log('test', 'Testando GET /products (público)...');
  const listResult = await makeRequest('GET', '/products');
  if (listResult.success) {
    log('success', `Produtos listados: ${listResult.data.length || 0} encontrados`);
  } else {
    log('error', 'Falha ao listar produtos', listResult.error);
  }
  
  // 2.2 Buscar produtos disponíveis (endpoint que pode estar quebrado)
  log('test', 'Testando GET /products/available...');
  const availableResult = await makeRequest('GET', '/products/available');
  if (availableResult.success) {
    log('success', `Produtos disponíveis: ${availableResult.data.length || 0} encontrados`);
  } else {
    log('error', 'ENDPOINT QUEBRADO: /products/available', availableResult.error);
  }
  
  // 2.3 Listar todos os produtos (admin)
  log('test', 'Testando GET /admin/products...');
  const adminListResult = await makeRequest('GET', '/admin/products', null, headers);
  if (adminListResult.success) {
    log('success', `Admin - Produtos listados: ${adminListResult.data.length || 0} encontrados`);
  } else {
    log('error', 'ENDPOINT QUEBRADO: /admin/products', adminListResult.error);
  }
  
  // 2.4 Criar produto via admin
  log('test', 'Testando POST /admin/products...');
  const newProduct = {
    nome: 'Produto Teste Admin',
    descricao: 'Produto criado via endpoint admin',
    preco: 15.99,
    categoriaId: 'cat-001', // Usando categoria existente
    estabelecimentoId: 'estab-001', // Usando estabelecimento existente
    estoque: 50,
    unidade: 'un',
    ativo: true
  };
  
  const createResult = await makeRequest('POST', '/admin/products', newProduct, headers);
  if (createResult.success) {
    log('success', 'Produto criado via admin com sucesso!', createResult.data);
  } else {
    log('error', 'ENDPOINT QUEBRADO: POST /admin/products', createResult.error);
  }
  
  return true;
}

// 3. Testar endpoints de usuários
async function testUserEndpoints() {
  if (!adminToken) return false;
  
  const headers = { 'Authorization': `Bearer ${adminToken}` };
  
  log('test', '👥 Testando endpoints de usuários...');
  
  // 3.1 Listar todos os usuários (admin)
  log('test', 'Testando GET /admin/usuarios...');
  const listResult = await makeRequest('GET', '/admin/usuarios', null, headers);
  if (listResult.success) {
    log('success', `Usuários listados: ${listResult.data.length || 0} encontrados`);
  } else {
    log('error', 'ENDPOINT QUEBRADO: /admin/usuarios', listResult.error);
  }
  
  // 3.2 Listar usuários pendentes
  log('test', 'Testando GET /admin/usuarios/pendentes...');
  const pendingResult = await makeRequest('GET', '/admin/usuarios/pendentes', null, headers);
  if (pendingResult.success) {
    log('success', `Usuários pendentes: ${pendingResult.data.length || 0} encontrados`);
  } else {
    log('error', 'ENDPOINT QUEBRADO: /admin/usuarios/pendentes', pendingResult.error);
  }
  
  // 3.3 Aprovar usuário (se houver algum pendente)
  if (pendingResult.success && pendingResult.data.length > 0) {
    const userId = pendingResult.data[0].id;
    log('test', `Testando PUT /admin/usuarios/${userId}/aprovar...`);
    const approveResult = await makeRequest('PUT', `/admin/usuarios/${userId}/aprovar`, null, headers);
    if (approveResult.success) {
      log('success', 'Usuário aprovado com sucesso!', approveResult.data);
    } else {
      log('error', 'ENDPOINT QUEBRADO: PUT /admin/usuarios/:id/aprovar', approveResult.error);
    }
  }
  
  return true;
}

// 4. Testar endpoints de estabelecimentos
async function testEstablishmentEndpoints() {
  if (!adminToken) return false;
  
  const headers = { 'Authorization': `Bearer ${adminToken}` };
  
  log('test', '🏪 Testando endpoints de estabelecimentos...');
  
  // 4.1 Listar estabelecimentos (admin)
  log('test', 'Testando GET /admin/estabelecimentos...');
  const listResult = await makeRequest('GET', '/admin/estabelecimentos', null, headers);
  if (listResult.success) {
    log('success', `Estabelecimentos listados: ${listResult.data.length || 0} encontrados`);
  } else {
    log('error', 'ENDPOINT QUEBRADO: /admin/estabelecimentos', listResult.error);
  }
  
  // 4.2 Criar estabelecimento
  log('test', 'Testando POST /admin/estabelecimentos...');
  const newEstablishment = {
    nome: 'Estabelecimento Teste Admin',
    cnpj: '12345678000199',
    endereco: 'Rua Teste, 123 - São Paulo/SP',
    telefone: '(11) 99999-9999',
    email: 'teste@estabelecimento.com',
    ativo: true,
    estaAberto: true
  };
  
  const createResult = await makeRequest('POST', '/admin/estabelecimentos', newEstablishment, headers);
  if (createResult.success) {
    log('success', 'Estabelecimento criado via admin!', createResult.data);
  } else {
    log('error', 'ENDPOINT QUEBRADO: POST /admin/estabelecimentos', createResult.error);
  }
  
  return true;
}

// 5. Testar endpoints de carrinho
async function testCartEndpoints() {
  if (!adminToken) return false;
  
  const headers = { 'Authorization': `Bearer ${adminToken}` };
  
  log('test', '🛒 Testando endpoints de carrinho...');
  
  // 5.1 Obter carrinho atual
  log('test', 'Testando GET /cart...');
  const cartResult = await makeRequest('GET', '/cart', null, headers);
  if (cartResult.success) {
    log('success', 'Carrinho obtido com sucesso!', cartResult.data);
  } else {
    log('error', 'ENDPOINT QUEBRADO: GET /cart', cartResult.error);
  }
  
  // 5.2 Buscar produto real para adicionar ao carrinho
  const productsResult = await makeRequest('GET', '/products');
  let realProductId = 'prod-001'; // fallback
  
  if (productsResult.success && productsResult.data.length > 0) {
    realProductId = productsResult.data[0].id;
  }
  
  // 5.3 Adicionar item ao carrinho
  log('test', 'Testando POST /cart/items...');
  const addItemResult = await makeRequest('POST', '/cart/items', {
    produtoId: realProductId, // Usando produto real
    quantidade: 2
  }, headers);
  
  if (addItemResult.success) {
    log('success', 'Item adicionado ao carrinho!', addItemResult.data);
  } else {
    log('error', 'ENDPOINT QUEBRADO: POST /cart/items', addItemResult.error);
  }
  
  return true;
}

// 6. Testar endpoints de pedidos
async function testOrderEndpoints() {
  if (!adminToken) return false;
  
  const headers = { 'Authorization': `Bearer ${adminToken}` };
  
  log('test', '📦 Testando endpoints de pedidos...');
  
  // 6.1 Listar pedidos
  log('test', 'Testando GET /pedidos...');
  const listResult = await makeRequest('GET', '/pedidos', null, headers);
  if (listResult.success) {
    log('success', `Pedidos listados: ${listResult.data.length || 0} encontrados`);
  } else {
    log('error', 'ENDPOINT QUEBRADO: GET /pedidos', listResult.error);
  }  // 6.2 Primeiro, buscar um produto real para usar no teste
  log('test', 'Buscando produto real para teste de pedido...');
  const productsResult = await makeRequest('GET', '/products');
  let realProductId = 'prod-001'; // fallback
  
  if (productsResult.success && productsResult.data.length > 0) {
    realProductId = productsResult.data[0].id;
    log('success', `Produto encontrado para teste: ${realProductId}`);
  }
  
  // 6.3 Criar pedido com produto real
  log('test', 'Testando POST /pedidos...');
  const newOrder = {
    itens: [
      {
        produtoId: realProductId,
        quantidade: 2
      }
    ],
    enderecoEntrega: 'Rua Teste, 123 - São Paulo/SP',
    observacoes: 'Pedido de teste da seed automatizada'
  };
  
  const createResult = await makeRequest('POST', '/pedidos', newOrder, headers);
  if (createResult.success) {
    log('success', 'Pedido criado com sucesso!', createResult.data);
  } else {
    log('error', 'ENDPOINT QUEBRADO: POST /pedidos', createResult.error);
  }
  
  return true;
}

// 7. Testar endpoints de perfil
async function testProfileEndpoints() {
  if (!adminToken) return false;
  
  const headers = { 'Authorization': `Bearer ${adminToken}` };
  
  log('test', '👤 Testando endpoints de perfil...');
  
  // 7.1 Obter perfil
  log('test', 'Testando GET /profile/me...');
  const profileResult = await makeRequest('GET', '/profile/me', null, headers);
  if (profileResult.success) {
    log('success', 'Perfil obtido com sucesso!', profileResult.data);
  } else {
    log('error', 'ENDPOINT QUEBRADO: GET /profile/me', profileResult.error);
  }
  
  // 7.2 Atualizar perfil
  log('test', 'Testando PUT /profile/me...');
  const updateResult = await makeRequest('PUT', '/profile/me', {
    nome: 'Admin Teste Atualizado',
    telefone: '(11) 88888-8888'
  }, headers);
  
  if (updateResult.success) {
    log('success', 'Perfil atualizado com sucesso!', updateResult.data);
  } else {
    log('error', 'ENDPOINT QUEBRADO: PUT /profile/me', updateResult.error);
  }
  
  return true;
}

// 8. Testar endpoints de parceiros
async function testPartnerEndpoints() {
  if (!adminToken) return false;
  
  const headers = { 'Authorization': `Bearer ${adminToken}` };
  
  log('test', '🤝 Testando endpoints de parceiros...');
  
  // 8.1 Dashboard do parceiro
  log('test', 'Testando GET /partner/dashboard...');
  const dashboardResult = await makeRequest('GET', '/partner/dashboard', null, headers);
  if (dashboardResult.success) {
    log('success', 'Dashboard do parceiro acessado!', dashboardResult.data);
  } else {
    log('error', 'ENDPOINT QUEBRADO: GET /partner/dashboard', dashboardResult.error);
  }
  
  // 8.2 Resumo do dashboard
  log('test', 'Testando GET /partner/dashboard/resumo...');
  const resumoResult = await makeRequest('GET', '/partner/dashboard/resumo', null, headers);
  if (resumoResult.success) {
    log('success', 'Resumo do dashboard obtido!', resumoResult.data);
  } else {
    log('error', 'ENDPOINT QUEBRADO: GET /partner/dashboard/resumo', resumoResult.error);
  }
  
  return true;
}

// Função principal
async function runEndpointTests() {
  console.log('\n🧪 === TESTE DE ENDPOINTS DO SISTEMA ZÉ DA FRUTA ===\n');
    // Verificar se o servidor está rodando
  log('test', 'Verificando se o servidor está rodando...');
  const healthCheck = await makeRequest('GET', '/health');
  if (!healthCheck.success) {
    log('error', 'Servidor não está rodando! Execute: npm run start:dev');
    return;
  }
  log('success', 'Servidor está rodando!');
  
  // 1. Login como admin
  const loginSuccess = await loginAsAdmin();
  if (!loginSuccess) {
    log('error', 'Não foi possível fazer login como admin. Parando testes.');
    return;
  }
  
  // 2. Executar testes de endpoints
  await testProductEndpoints();
  await testUserEndpoints();
  await testEstablishmentEndpoints();
  await testCartEndpoints();
  await testOrderEndpoints();
  await testProfileEndpoints();
  await testPartnerEndpoints();
  
  // 3. Salvar relatório
  const reportPath = path.join(__dirname, 'endpoint-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalTests: testResults.length,
    results: testResults
  }, null, 2));
  
  // 4. Resumo final
  const successCount = testResults.filter(r => r.type === 'success').length;
  const errorCount = testResults.filter(r => r.type === 'error').length;
  
  console.log('\n📊 === RESUMO DOS TESTES ===');
  log('info', `Total de testes: ${testResults.length}`);
  log('success', `Sucessos: ${successCount}`);
  log('error', `Falhas: ${errorCount}`);
  log('info', `Relatório salvo em: ${reportPath}`);
  
  if (errorCount > 0) {
    console.log('\n❌ ENDPOINTS QUEBRADOS IDENTIFICADOS:');
    testResults.filter(r => r.type === 'error' && r.message.includes('ENDPOINT QUEBRADO'))
                .forEach(r => console.log(`   - ${r.message}`));
  }
  
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('   1. Corrigir endpoints quebrados identificados');
  console.log('   2. Implementar endpoints faltantes');
  console.log('   3. Adicionar validações TypeORM');
  console.log('   4. Testar novamente');
}

// Executar testes
runEndpointTests().catch(console.error);
