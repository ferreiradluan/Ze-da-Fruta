#!/usr/bin/env node

/**
 * 🔍 TESTE DE CONECTIVIDADE - HEROKU PRODUÇÃO
 * 
 * ✅ Verifica se a aplicação está online no Heroku
 * ✅ Testa endpoints principais
 * ✅ Mostra dados existentes
 * 
 * USO: node scripts/test-heroku-connectivity.js
 */

const axios = require('axios');

// ===== CONFIGURAÇÕES =====
const BASE_URL = 'https://meu-ze-da-fruta-backend-8c4976f28553.herokuapp.com';

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
  console.log(`🔍 ${title.toUpperCase()}`);
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// ===== UTILITÁRIOS =====
async function testEndpoint(endpoint, description) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    log(`🔍 Testando: ${description}`, 'cyan');
    log(`   URL: ${url}`, 'cyan');
    
    const response = await axios.get(url, { 
      timeout: 10000,
      validateStatus: () => true
    });
    
    if (response.status >= 200 && response.status < 300) {
      logSuccess(`Status: ${response.status} ✅`);
      
      // Mostrar dados se existirem
      if (response.data) {
        const data = response.data;
        if (Array.isArray(data)) {
          logInfo(`   📊 ${data.length} itens encontrados`);
          if (data.length > 0) {
            log(`   🔸 Primeiro item: ${JSON.stringify(data[0]).substring(0, 100)}...`, 'cyan');
          }
        } else if (typeof data === 'object') {
          logInfo(`   📊 Objeto retornado: ${Object.keys(data).join(', ')}`);
        } else {
          logInfo(`   📊 Dados: ${data}`);
        }
      }
      
      return { success: true, status: response.status, data: response.data };
    } else {
      logError(`Status: ${response.status} - ${response.statusText}`);
      return { success: false, status: response.status, error: response.data };
    }
  } catch (error) {
    logError(`Erro: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ===== TESTES =====
async function testarConectividade() {
  logSection('TESTE DE CONECTIVIDADE HEROKU');
  
  const testes = [
    { endpoint: '/', description: 'Home/Root da aplicação' },
    { endpoint: '/health', description: 'Health check' },
    { endpoint: '/api/docs', description: 'Documentação Swagger' }
  ];
  
  for (const teste of testes) {
    await testEndpoint(teste.endpoint, teste.description);
    console.log(''); // linha em branco
  }
}

async function testarEndpointsPublicos() {
  logSection('ENDPOINTS PÚBLICOS');
  
  const testes = [
    { endpoint: '/sales/public/establishments', description: 'Listar estabelecimentos' },
    { endpoint: '/sales/public/products', description: 'Listar produtos' },
    { endpoint: '/sales/public/categories', description: 'Listar categorias' }
  ];
  
  let dadosEncontrados = {
    estabelecimentos: 0,
    produtos: 0,
    categorias: 0
  };
  
  for (const teste of testes) {
    const resultado = await testEndpoint(teste.endpoint, teste.description);
    
    if (resultado.success && Array.isArray(resultado.data)) {
      if (teste.endpoint.includes('establishments')) {
        dadosEncontrados.estabelecimentos = resultado.data.length;
      } else if (teste.endpoint.includes('products')) {
        dadosEncontrados.produtos = resultado.data.length;
      } else if (teste.endpoint.includes('categories')) {
        dadosEncontrados.categorias = resultado.data.length;
      }
    }
    
    console.log(''); // linha em branco
  }
  
  return dadosEncontrados;
}

async function testarAuth() {
  logSection('TESTE DE AUTENTICAÇÃO');
  
  const credenciais = {
    email: 'zedafruta@admin.com',
    senha: 'zedafruta321'
  };
  
  logInfo('Testando login de admin...');
  const resultado = await testEndpoint('/auth/admin/login', 'Login Admin');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/admin/login`, credenciais, {
      timeout: 10000,
      validateStatus: () => true
    });
    
    if (response.status === 200 && response.data.access_token) {
      logSuccess('Login realizado com sucesso!');
      logInfo(`Token obtido: ${response.data.access_token.substring(0, 20)}...`);
      return { success: true, token: response.data.access_token };
    } else {
      logError(`Falha no login: Status ${response.status}`);
      return { success: false, status: response.status, error: response.data };
    }
  } catch (error) {
    logError(`Erro no login: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function mostrarResumo(dados) {
  logSection('RESUMO DA APLICAÇÃO');
  
  logInfo(`🌐 URL: ${BASE_URL}`);
  logInfo(`📊 Estabelecimentos: ${dados.estabelecimentos}`);
  logInfo(`📦 Produtos: ${dados.produtos}`);
  logInfo(`🏷️  Categorias: ${dados.categorias}`);
  
  if (dados.estabelecimentos === 0 && dados.produtos === 0) {
    log('', 'yellow');
    log('⚠️  BANCO VAZIO - EXECUTE UM SEED PARA POPULAR:', 'yellow');
    log('   npm run seed:heroku', 'cyan');
    log('   ou', 'yellow');
    log('   npm run seed:heroku-sql', 'cyan');
  } else {
    log('', 'green');
    logSuccess('APLICAÇÃO PRONTA PARA USO!');
    logInfo('Para integração frontend, consulte: GUIA-INTEGRACAO-FRONTEND.md');
  }
}

// ===== FUNÇÃO PRINCIPAL =====
async function main() {
  try {
    console.log('🔍 TESTE DE CONECTIVIDADE - ZÉ DA FRUTA HEROKU');
    console.log('='.repeat(60));
    
    // Teste de conectividade básica
    await testarConectividade();
    
    // Teste dos endpoints públicos
    const dados = await testarEndpointsPublicos();
    
    // Teste de autenticação
    await testarAuth();
    
    // Resumo final
    await mostrarResumo(dados);
    
  } catch (error) {
    logError(`Erro inesperado: ${error.message}`);
    process.exit(1);
  }
}

// ===== EXECUÇÃO =====
if (require.main === module) {
  main();
}

module.exports = { main, testEndpoint, testarConectividade, testarEndpointsPublicos };
