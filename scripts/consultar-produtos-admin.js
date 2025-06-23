#!/usr/bin/env node

/**
 * 🔍 CONSULTAR PRODUTOS ADMIN - ZÉ DA FRUTA
 * 
 * ✅ Script rápido para apresentação
 * ✅ Faz login como admin e lista produtos
 * ✅ Formato JSON para uso no frontend
 * 
 * USO: node scripts/consultar-produtos-admin.js
 */

const axios = require('axios');

// ===== CONFIGURAÇÕES =====
const BASE_URL = 'https://meu-ze-da-fruta-backend-8c4976f28553.herokuapp.com';
const ADMIN_CREDENTIALS = {
  email: 'zedafruta@admin.com',
  senha: 'zedafruta321'
};

// ===== CORES =====
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

// ===== FAZER REQUEST =====
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  try {
    const response = await axios({
      url,
      method: options.method || 'GET',
      data: options.data,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 10000,
      validateStatus: () => true
    });

    return {
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response.data,
      error: response.status >= 400 ? response.data : null
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      error: error.message,
      data: null
    };
  }
}

// ===== LOGIN ADMIN =====
async function loginAdmin() {
  log('🔐 Fazendo login como admin...', 'blue');
  
  const result = await makeRequest('/auth/admin/login', {
    method: 'POST',
    data: ADMIN_CREDENTIALS
  });

  if (result.success && result.data?.access_token) {
    log('✅ Login realizado com sucesso!', 'green');
    return result.data.access_token;
  } else {
    log(`❌ Erro no login: ${result.status}`, 'red');
    console.log(result.error);
    return null;
  }
}

// ===== BUSCAR PRODUTOS =====
async function buscarProdutos(token) {
  log('\n📦 Buscando produtos...', 'blue');
  
  const result = await makeRequest('/admin/products', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (result.success) {
    const produtos = result.data;
    log(`✅ ${produtos.length} produtos encontrados!`, 'green');
    return produtos;
  } else {
    log(`❌ Erro ao buscar produtos: ${result.status}`, 'red');
    console.log(result.error);
    return [];
  }
}

// ===== BUSCAR ESTABELECIMENTOS =====
async function buscarEstabelecimentos() {
  log('🏪 Buscando estabelecimentos...', 'blue');
  
  const result = await makeRequest('/sales/public/establishments');

  if (result.success) {
    const estabelecimentos = result.data?.estabelecimentos || result.data;
    log(`✅ ${estabelecimentos.length} estabelecimentos encontrados!`, 'green');
    return estabelecimentos;
  } else {
    log(`❌ Erro ao buscar estabelecimentos: ${result.status}`, 'red');
    return [];
  }
}

// ===== BUSCAR CATEGORIAS =====
async function buscarCategorias() {
  log('🏷️ Buscando categorias...', 'blue');
  
  const result = await makeRequest('/sales/public/categories');

  if (result.success) {
    const categorias = result.data?.categorias || result.data;
    log(`✅ ${categorias.length} categorias encontradas!`, 'green');
    return categorias;
  } else {
    log(`❌ Erro ao buscar categorias: ${result.status}`, 'red');
    return [];
  }
}

// ===== FUNÇÃO PRINCIPAL =====
async function main() {
  console.clear();
  log('🍎 CONSULTA RÁPIDA - ZÉ DA FRUTA', 'bold');
  log('=' .repeat(50), 'cyan');
  
  try {
    // 1. Login
    const token = await loginAdmin();
    if (!token) {
      process.exit(1);
    }

    // 2. Buscar dados
    const [produtos, estabelecimentos, categorias] = await Promise.all([
      buscarProdutos(token),
      buscarEstabelecimentos(),
      buscarCategorias()
    ]);

    // 3. Exibir resumo
    log('\n📊 RESUMO DOS DADOS:', 'yellow');
    log(`   • Produtos: ${produtos.length}`, 'cyan');
    log(`   • Estabelecimentos: ${estabelecimentos.length}`, 'cyan');
    log(`   • Categorias: ${categorias.length}`, 'cyan');

    // 4. JSON para o frontend
    log('\n🎯 JSON PARA O FRONTEND:', 'yellow');
    log('=' .repeat(50), 'cyan');
    
    const dadosParaFrontend = {
      produtos: produtos.slice(0, 10), // Primeiros 10 produtos
      estabelecimentos: estabelecimentos.slice(0, 6), // Primeiros 6 estabelecimentos
      categorias: categorias.slice(0, 10), // Primeiras 10 categorias
      timestamp: new Date().toISOString(),
      total: {
        produtos: produtos.length,
        estabelecimentos: estabelecimentos.length,
        categorias: categorias.length
      }
    };

    console.log(JSON.stringify(dadosParaFrontend, null, 2));

    // 5. Amostra de produtos
    if (produtos.length > 0) {
      log('\n🥬 AMOSTRA DE PRODUTOS:', 'yellow');
      produtos.slice(0, 5).forEach((produto, index) => {
        log(`   ${index + 1}. ${produto.nome} - R$ ${produto.preco} (${produto.unidadeMedida})`, 'green');
      });
    }

    log('\n✅ Consulta concluída com sucesso!', 'green');
    log('📋 Use o JSON acima no seu frontend para a apresentação.', 'cyan');

  } catch (error) {
    log(`❌ Erro fatal: ${error.message}`, 'red');
    process.exit(1);
  }
}

// ===== EXECUTAR =====
if (require.main === module) {
  main();
}

module.exports = { main, loginAdmin, buscarProdutos };
