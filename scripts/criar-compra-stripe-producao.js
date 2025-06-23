#!/usr/bin/env node

/**
 * 🧪 CRIAÇÃO DE COMPRA COM STRIPE - PRODUÇÃO
 * 
 * OBJETIVO: Criar uma compra completa com Stripe em produção
 * 1. Login como admin para buscar produtos
 * 2. Fazer login como usuário para obter token
 * 3. Criar sessão de checkout no Stripe
 * 4. Retornar URL da página de pagamento
 * 
 * USO: node scripts/criar-compra-stripe-producao.js
 */

const axios = require('axios');
const readline = require('readline');

// ===== CONFIGURAÇÕES PRODUÇÃO =====
const BASE_URL = 'https://meu-ze-da-fruta-backend-8c4976f28553.herokuapp.com';

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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(70), 'cyan');
  log(`🧪 ${title}`, 'bold');
  log('='.repeat(70), 'cyan');
}

// ===== ESTADO GLOBAL =====
let adminToken = null;
let userToken = null;
let produtos = [];
let checkoutUrl = null;
let sessionId = null;

/**
 * 1. LOGIN COMO ADMIN
 */
async function loginComoAdmin() {
  logSection('ETAPA 1: LOGIN COMO ADMIN');
  
  try {
    log('🔐 Fazendo login como admin...', 'yellow');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'zedafruta@admin.com',
      password: 'admin123'
    });
    
    adminToken = response.data.access_token;
    log('✅ Login admin realizado com sucesso!', 'green');
    log(`🔑 Token: ${adminToken.substring(0, 30)}...`, 'cyan');
    
    return true;
  } catch (error) {
    log('❌ Erro no login admin:', 'red');
    log(`   ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

/**
 * 2. BUSCAR PRODUTOS
 */
async function buscarProdutos() {
  logSection('ETAPA 2: BUSCAR PRODUTOS DISPONÍVEIS');
  
  try {
    log('📦 Buscando produtos via admin...', 'yellow');
    
    const response = await axios.get(`${BASE_URL}/admin/products`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    produtos = response.data || [];
    
    if (produtos.length === 0) {
      log('❌ Nenhum produto encontrado', 'red');
      return false;
    }
    
    log(`✅ ${produtos.length} produtos encontrados!`, 'green');
    log('\n🛍️ PRODUTOS DISPONÍVEIS:', 'blue');
    
    produtos.slice(0, 5).forEach((produto, index) => {
      log(`   ${index + 1}. ${produto.nome || produto.name}`, 'cyan');
      log(`      💰 R$ ${(produto.preco || produto.price || 10).toFixed(2)}`, 'cyan');
      log(`      🆔 ID: ${produto.id}`, 'cyan');
      log(`      🏪 Estabelecimento: ${produto.estabelecimentoId || 'N/A'}`, 'cyan');
    });
    
    return true;
  } catch (error) {
    log('❌ Erro ao buscar produtos:', 'red');
    log(`   ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

/**
 * 3. SOLICITAR TOKEN DO USUÁRIO
 */
async function solicitarTokenUsuario() {
  logSection('ETAPA 3: OBTENÇÃO DO TOKEN DE USUÁRIO');
  
  log('🔑 PARA CRIAR A COMPRA, PRECISAMOS DE UM TOKEN DE USUÁRIO', 'yellow');
  log('', 'reset');
  log('🔗 OPÇÕES PARA OBTER TOKEN:', 'blue');
  log(`   1. Login Google: ${BASE_URL}/auth/google`, 'cyan');
  log(`   2. Login direto: ${BASE_URL}/auth/login`, 'cyan');
  log('', 'reset');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('📝 Cole o token JWT do usuário: ', (token) => {
      if (token && token.length > 50) {
        // Limpar token se tiver "Bearer " no início
        if (token.startsWith('Bearer ')) {
          token = token.substring(7);
        }
        
        userToken = token.trim();
        
        try {
          const payload = JSON.parse(Buffer.from(userToken.split('.')[1], 'base64').toString());
          
          log('✅ Token de usuário configurado!', 'green');
          log(`   👤 Email: ${payload.email || 'N/A'}`, 'cyan');
          log(`   🆔 ID: ${payload.sub || payload.id || 'N/A'}`, 'cyan');
          
          rl.close();
          resolve(true);
        } catch (e) {
          log('⚠️  Token configurado (não foi possível decodificar)', 'yellow');
          rl.close();
          resolve(true);
        }
      } else {
        log('❌ Token inválido! Tentando com token simulado...', 'red');
        userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXRlc3RlLTEiLCJlbWFpbCI6InVzZXJAdGVzdGUuY29tIiwiaWF0IjoxNjM5NjgwMDAwLCJleHAiOjk5OTk5OTk5OTl9.test';
        rl.close();
        resolve(false);
      }
    });
  });
}

/**
 * 4. CRIAR CHECKOUT STRIPE
 */
async function criarCheckoutStripe() {
  logSection('ETAPA 4: CRIAR SESSÃO DE CHECKOUT STRIPE');
  
  if (produtos.length === 0) {
    log('❌ Não há produtos para criar checkout', 'red');
    return false;
  }
  
  // Selecionar primeiros 3 produtos
  const produtosSelecionados = produtos.slice(0, 3);
  
  const dadosCheckout = {
    itens: produtosSelecionados.map(produto => ({
      produtoId: produto.id,
      nome: produto.nome || produto.name || 'Produto',
      preco: produto.preco || produto.price || 10.00,
      quantidade: Math.floor(Math.random() * 2) + 1 // 1-2 unidades
    })),
    enderecoEntrega: 'Rua Teste Stripe, 123 - Centro - São Paulo/SP - CEP: 01010-000',
    observacoes: 'Teste de compra via Stripe - demonstração',
    metodoPagamento: 'STRIPE_CHECKOUT'
  };
  
  const valorTotal = dadosCheckout.itens.reduce((total, item) => 
    total + (item.preco * item.quantidade), 0
  );
  
  log('🛒 CRIANDO CARRINHO PARA O STRIPE:', 'blue');
  log(`   📦 ${dadosCheckout.itens.length} produtos selecionados`, 'cyan');
  log(`   💰 Valor total: R$ ${valorTotal.toFixed(2)}`, 'cyan');
  log('', 'reset');
  
  dadosCheckout.itens.forEach((item, index) => {
    log(`   ${index + 1}. ${item.nome}`, 'cyan');
    log(`      💰 R$ ${item.preco.toFixed(2)} x ${item.quantidade} = R$ ${(item.preco * item.quantidade).toFixed(2)}`, 'cyan');
  });
  
  try {
    log('\n🔄 Enviando para Stripe...', 'yellow');
    
    const response = await axios.post(`${BASE_URL}/payment/create-checkout-session`, dadosCheckout, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    });
    
    if (response.status === 200 && response.data.sessionId) {
      sessionId = response.data.sessionId;
      checkoutUrl = response.data.checkoutUrl;
      
      log('🎉 SESSÃO DE CHECKOUT CRIADA COM SUCESSO!', 'green');
      log('', 'reset');
      log('='.repeat(70), 'magenta');
      log('💳 PÁGINA DE PAGAMENTO STRIPE GERADA:', 'bold');
      log('', 'reset');
      log(checkoutUrl, 'cyan');
      log('', 'reset');
      log('='.repeat(70), 'magenta');
      log('', 'reset');
      log('💡 DADOS PARA TESTE NO STRIPE:', 'yellow');
      log('   • Cartão: 4242 4242 4242 4242', 'cyan');
      log('   • Validade: 12/30', 'cyan');
      log('   • CVC: 123', 'cyan');
      log('   • Nome: Teste Usuario', 'cyan');
      log('', 'reset');
      log('📊 DETALHES DA COMPRA:', 'blue');
      log(`   🆔 Session ID: ${sessionId}`, 'cyan');
      log(`   💰 Valor: R$ ${valorTotal.toFixed(2)}`, 'cyan');
      log(`   📦 Produtos: ${dadosCheckout.itens.length}`, 'cyan');
      log(`   📍 Endereço: ${dadosCheckout.enderecoEntrega}`, 'cyan');
      
      return true;
    } else {
      log('❌ Resposta inesperada do servidor:', 'red');
      log(JSON.stringify(response.data, null, 2), 'yellow');
      return false;
    }
  } catch (error) {
    log('❌ Erro ao criar checkout:', 'red');
    
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Resposta: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
      
      if (error.response.status === 401) {
        log('   💡 Token de usuário pode estar inválido', 'yellow');
      }
    } else {
      log(`   Erro: ${error.message}`, 'red');
    }
    
    return false;
  }
}

/**
 * 5. RELATÓRIO FINAL
 */
function gerarRelatorioFinal() {
  logSection('RELATÓRIO FINAL');
  
  if (checkoutUrl && sessionId) {
    log('🎯 COMPRA CRIADA COM SUCESSO!', 'green');
    log('', 'reset');
    log('✅ FLUXO COMPLETADO:', 'green');
    log('   1. ✅ Login admin realizado', 'green');
    log('   2. ✅ Produtos capturados', 'green');
    log('   3. ✅ Token de usuário configurado', 'green');
    log('   4. ✅ Sessão Stripe criada', 'green');
    log('', 'reset');
    log('🔗 LINK FINAL PARA PAGAMENTO:', 'bold');
    log(checkoutUrl, 'cyan');
    log('', 'reset');
    log('📋 PRÓXIMOS PASSOS:', 'blue');
    log('   1. Abra o link acima no navegador', 'cyan');
    log('   2. Use os dados de teste do cartão', 'cyan');
    log('   3. Complete o pagamento', 'cyan');
    log('   4. Verifique se o webhook foi processado', 'cyan');
    
    // Salvar dados para referência
    const dadosCompra = {
      sessionId,
      checkoutUrl,
      valorTotal: produtos.slice(0, 3).reduce((total, produto) => 
        total + (produto.preco || 10), 0
      ).toFixed(2),
      timestamp: new Date().toISOString(),
      produtos: produtos.slice(0, 3).map(p => ({
        id: p.id,
        nome: p.nome || p.name,
        preco: p.preco || p.price || 10
      }))
    };
    
    require('fs').writeFileSync(
      'ultima-compra-stripe.json', 
      JSON.stringify(dadosCompra, null, 2)
    );
    
    log('\n💾 Dados salvos em: ultima-compra-stripe.json', 'cyan');
    
  } else {
    log('❌ COMPRA NÃO FOI CRIADA', 'red');
    log('', 'reset');
    log('🔧 PROBLEMAS IDENTIFICADOS:', 'yellow');
    log('   • Verifique se o servidor está rodando', 'cyan');
    log('   • Verifique se há produtos no banco', 'cyan');
    log('   • Verifique se o token de usuário é válido', 'cyan');
    log('   • Verifique configuração do Stripe', 'cyan');
  }
}

/**
 * FUNÇÃO PRINCIPAL
 */
async function main() {
  log('🧪 CRIAÇÃO DE COMPRA COM STRIPE - PRODUÇÃO', 'bold');
  log('🔗 Backend: https://meu-ze-da-fruta-backend-8c4976f28553.herokuapp.com', 'cyan');
  log(`⏰ Início: ${new Date().toLocaleString()}`, 'cyan');
  
  try {
    // 1. Login como admin
    const adminOk = await loginComoAdmin();
    if (!adminOk) {
      log('\n❌ Falha no login admin. Abortando...', 'red');
      process.exit(1);
    }
    
    // 2. Buscar produtos
    const produtosOk = await buscarProdutos();
    if (!produtosOk) {
      log('\n❌ Falha ao buscar produtos. Abortando...', 'red');
      process.exit(1);
    }
    
    // 3. Solicitar token do usuário
    const userOk = await solicitarTokenUsuario();
    
    // 4. Criar checkout
    await criarCheckoutStripe();
    
    // 5. Relatório final
    gerarRelatorioFinal();
    
  } catch (error) {
    log(`\n❌ Erro durante execução: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Executar se foi chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { main };
