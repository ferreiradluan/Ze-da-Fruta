#!/usr/bin/env node

/**
 * 🛒 GERAR COMPRA STRIPE COMPLETA - PRODUÇÃO
 * 
 * OBJETIVO: Criar uma compra completa com Stripe em produção
 * 1. Login como admin
 * 2. Buscar produtos disponíveis
 * 3. Obter token de usuário
 * 4. Criar sessão de checkout Stripe
 * 5. Gerar link de pagamento para apresentação
 * 
 * VERSÃO: 2.0 - Corrigido endpoint de login admin
 * USO: node scripts/gerar-compra-stripe-completa.js
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
  log(`🛒 ${title}`, 'bold');
  log('='.repeat(70), 'cyan');
}

// ===== ESTADO GLOBAL =====
let adminToken = null;
let userToken = null;
let produtos = [];
let checkoutSessionId = null;
let checkoutUrl = null;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 1. LOGIN COMO ADMIN
 */
async function loginAdmin() {
  logSection('ETAPA 1: LOGIN ADMIN');
  
  log('🔑 Fazendo login como administrador...', 'yellow');
    const credenciaisAdmin = {
    email: 'zedafruta@admin.com',
    senha: 'admin123' // Usando 'senha', não 'password'
  };
  
  try {
    log(`📧 Email: ${credenciaisAdmin.email}`, 'cyan');
    log('🔐 Tentando login via /auth/admin/login...', 'cyan');
    
    const response = await axios.post(`${BASE_URL}/auth/admin/login`, credenciaisAdmin, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    
    if (response.status === 200 && response.data.access_token) {
      adminToken = response.data.access_token;
      
      log('✅ Login admin realizado com sucesso!', 'green');
      log(`🎫 Token: ${adminToken.substring(0, 30)}...`, 'cyan');
      
      // Extrair dados do token se possível
      try {
        const payload = JSON.parse(Buffer.from(adminToken.split('.')[1], 'base64').toString());
        log(`👤 Admin: ${payload.email || 'N/A'}`, 'cyan');
        log(`🆔 ID: ${payload.sub || payload.id || 'N/A'}`, 'cyan');
        log(`🔑 Roles: ${payload.roles ? payload.roles.join(', ') : 'N/A'}`, 'cyan');
      } catch (e) {
        log('⚠️  Não foi possível decodificar o token completamente', 'yellow');
      }
      
      return true;
    } else {
      log(`❌ Login falhou: Status ${response.status}`, 'red');
      log(`Resposta: ${JSON.stringify(response.data, null, 2)}`, 'red');
      return false;
    }
  } catch (error) {
    log('❌ Erro no login admin:', 'red');
    log(`   ${error.message}`, 'red');
    
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Dados: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    
    return false;
  }
}

/**
 * 2. BUSCAR PRODUTOS
 */
async function buscarProdutos() {
  logSection('ETAPA 2: BUSCAR PRODUTOS');
  
  log('📦 Buscando produtos no banco de produção...', 'yellow');
  
  const endpoints = ['/products', '/sales/public/products', '/catalog/products'];
  
  for (const endpoint of endpoints) {
    try {
      log(`🔍 Testando: GET ${endpoint}`, 'cyan');
      
      const headers = adminToken ? {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      } : {};
      
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        headers,
        timeout: 15000
      });
      
      if (response.status === 200 && response.data) {
        let produtosData = Array.isArray(response.data) ? response.data : 
                          response.data.produtos || response.data.data || [];
        
        if (produtosData.length > 0) {
          produtos = produtosData.slice(0, 5).map(p => ({
            id: p.id || p.productId,
            nome: p.nome || p.name,
            preco: p.preco || p.price || 10.00,
            descricao: p.descricao || p.description || '',
            categoria: p.categoria || p.category || 'Geral',
            loja: p.estabelecimento || p.loja || 'Loja Padrão',
            estoque: p.estoque || p.stockQuantity || 99
          }));
          
          log(`✅ ${produtos.length} produtos encontrados via ${endpoint}!`, 'green');
          log('', 'reset');
          log('🛍️ PRODUTOS SELECIONADOS PARA COMPRA:', 'blue');
          produtos.forEach((produto, index) => {
            log(`   ${index + 1}. ${produto.nome}`, 'cyan');
            log(`      💰 R$ ${produto.preco.toFixed(2)}`, 'cyan');
            log(`      🏪 ${produto.loja}`, 'cyan');
            log(`      📂 ${produto.categoria}`, 'cyan');
            log('', 'reset');
          });
          
          return true;
        }
      }
    } catch (error) {
      log(`   ❌ Erro: ${error.message}`, 'red');
    }
  }
  
  log('❌ Não foi possível encontrar produtos!', 'red');
  return false;
}

/**
 * 3. OBTER TOKEN DE USUÁRIO
 */
async function obterTokenUsuario() {
  logSection('ETAPA 3: OBTER TOKEN DE USUÁRIO');
  
  log('👤 Para fazer uma compra, precisamos de um token de usuário (não admin)', 'yellow');
  log('', 'reset');
  log('📋 OPÇÕES:', 'blue');
  log('   1. Fornecer token de usuário existente', 'cyan');
  log('   2. Usar o Google OAuth para obter novo token', 'cyan');
  log('   3. Simular token para teste (pode falhar)', 'cyan');
  log('', 'reset');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('🔸 Escolha uma opção (1, 2 ou 3): ', (opcao) => {
      if (opcao === '1') {
        rl.question('📝 Cole o token JWT do usuário: ', (token) => {
          if (token && token.length > 50) {
            userToken = token.trim();
            if (userToken.startsWith('Bearer ')) {
              userToken = userToken.substring(7);
            }
            
            log('✅ Token de usuário configurado!', 'green');
            log(`🎫 Token: ${userToken.substring(0, 30)}...`, 'cyan');
            rl.close();
            resolve(true);
          } else {
            log('❌ Token inválido!', 'red');
            rl.close();
            resolve(false);
          }
        });
      } else if (opcao === '2') {
        log('🔗 LINK PARA GOOGLE OAUTH:', 'bold');
        log(`   ${BASE_URL}/auth/user/google`, 'cyan');
        log('', 'reset');
        log('📋 INSTRUÇÕES:', 'blue');
        log('   1. Abra o link acima no navegador', 'cyan');
        log('   2. Complete o login com Google', 'cyan');
        log('   3. Copie o token retornado', 'cyan');
        log('', 'reset');
        
        rl.question('📝 Cole o token obtido: ', (token) => {
          if (token && token.length > 50) {
            userToken = token.trim();
            if (userToken.startsWith('Bearer ')) {
              userToken = userToken.substring(7);
            }
            
            log('✅ Token de usuário configurado via Google!', 'green');
            rl.close();
            resolve(true);
          } else {
            log('❌ Token inválido!', 'red');
            rl.close();
            resolve(false);
          }
        });
      } else {
        log('⚠️  Simulando token de usuário (pode falhar na auth)', 'yellow');
        userToken = 'simulated-user-token-for-testing';
        rl.close();
        resolve(false); // False indica que é simulado
      }
    });
  });
}

/**
 * 4. CRIAR COMPRA STRIPE
 */
async function criarCompraStripe() {
  logSection('ETAPA 4: CRIAR COMPRA STRIPE');
  
  if (produtos.length === 0) {
    log('❌ Não há produtos para comprar!', 'red');
    return false;
  }
  
  if (!userToken) {
    log('❌ Token de usuário necessário para compra!', 'red');
    return false;
  }
  
  // Preparar dados da compra
  const itensCompra = produtos.map(produto => ({
    produtoId: produto.id,
    nome: produto.nome,
    preco: produto.preco,
    quantidade: Math.floor(Math.random() * 2) + 1, // 1-2 unidades
    categoria: produto.categoria,
    loja: produto.loja
  }));
  
  const dadosCompra = {
    itens: itensCompra,
    enderecoEntrega: 'Rua Demonstração Stripe, 123 - Centro - São Paulo/SP - CEP: 01010-000',
    observacoes: 'Compra de demonstração - Teste Stripe em produção',
    metodoPagamento: 'STRIPE_CHECKOUT'
  };
  
  // Calcular total
  const valorTotal = itensCompra.reduce((total, item) => total + (item.preco * item.quantidade), 0);
  
  log('🛒 DADOS DA COMPRA:', 'blue');
  log(`   📦 Total de itens: ${itensCompra.length}`, 'cyan');
  log(`   💰 Valor total: R$ ${valorTotal.toFixed(2)}`, 'cyan');
  log('', 'reset');
  
  itensCompra.forEach((item, index) => {
    const subtotal = item.preco * item.quantidade;
    log(`   ${index + 1}. ${item.nome}`, 'cyan');
    log(`      🏪 ${item.loja}`, 'cyan');
    log(`      💵 R$ ${item.preco.toFixed(2)} x ${item.quantidade} = R$ ${subtotal.toFixed(2)}`, 'cyan');
    log('', 'reset');
  });
  
  log(`   📍 Endereço: ${dadosCompra.enderecoEntrega}`, 'cyan');
  log('', 'reset');
  
  try {
    log('🔄 Enviando compra para Stripe...', 'yellow');
    
    const headers = {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.post(`${BASE_URL}/payment/create-checkout-session`, dadosCompra, {
      headers,
      timeout: 20000
    });
    
    if (response.status === 200 || response.status === 201) {
      const data = response.data;
      
      if (data.sessionId) {
        checkoutSessionId = data.sessionId;
        checkoutUrl = data.checkoutUrl;
        
        log('🎉 COMPRA STRIPE CRIADA COM SUCESSO!', 'green');
        log('', 'reset');
        log('='.repeat(70), 'magenta');
        log('💳 LINK DA PÁGINA DE PAGAMENTO STRIPE:', 'bold');
        log('', 'reset');
        log(`${checkoutUrl}`, 'cyan');
        log('', 'reset');
        log('='.repeat(70), 'magenta');
        log('', 'reset');
        log('💡 DADOS PARA TESTE NO STRIPE:', 'yellow');
        log('   • Cartão: 4242 4242 4242 4242', 'cyan');
        log('   • Validade: 12/30 (qualquer data futura)', 'cyan');
        log('   • CVC: 123 (qualquer 3 dígitos)', 'cyan');
        log('   • Nome: Qualquer nome', 'cyan');
        log('', 'reset');
        log('📋 RESUMO DA COMPRA:', 'blue');
        log(`   🆔 Session ID: ${checkoutSessionId}`, 'cyan');
        log(`   💰 Valor: R$ ${valorTotal.toFixed(2)}`, 'cyan');
        log(`   📦 Produtos: ${itensCompra.length}`, 'cyan');
        log(`   🏪 Lojas: ${[...new Set(itensCompra.map(i => i.loja))].join(', ')}`, 'cyan');
        
        return true;
      } else {
        log('❌ Resposta sem Session ID!', 'red');
        log(`   ${JSON.stringify(data, null, 2)}`, 'yellow');
        return false;
      }
    } else {
      log(`❌ Falha na criação: Status ${response.status}`, 'red');
      log(`   ${JSON.stringify(response.data, null, 2)}`, 'yellow');
      return false;
    }
  } catch (error) {
    log('❌ Erro ao criar compra Stripe:', 'red');
    log(`   ${error.message}`, 'red');
    
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      
      if (error.response.status === 401) {
        log('   🔑 Token de usuário inválido ou expirado!', 'yellow');
        log('   💡 Obtenha um novo token via Google OAuth', 'cyan');
      }
      
      log(`   Resposta: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    
    return false;
  }
}

/**
 * 5. RELATÓRIO FINAL
 */
async function gerarRelatorioFinal() {
  logSection('RELATÓRIO FINAL - COMPRA STRIPE');
  
  if (checkoutUrl) {
    log('🎯 COMPRA GERADA COM SUCESSO!', 'bold');
    log('', 'reset');
    log('✅ ETAPAS CONCLUÍDAS:', 'green');
    log('   1. ✅ Login admin realizado', 'green');
    log('   2. ✅ Produtos carregados do banco', 'green');
    log('   3. ✅ Token de usuário configurado', 'green');
    log('   4. ✅ Sessão Stripe criada', 'green');
    log('   5. ✅ Link de pagamento gerado', 'green');
    log('', 'reset');
    log('🔗 LINK PARA APRESENTAÇÃO:', 'bold');
    log('', 'reset');
    log(`${checkoutUrl}`, 'cyan');
    log('', 'reset');
    log('💳 DADOS PARA DEMONSTRAÇÃO:', 'yellow');
    log('   • Número: 4242 4242 4242 4242', 'cyan');
    log('   • Validade: 12/30', 'cyan');
    log('   • CVC: 123', 'cyan');
    log('   • Nome: João Silva', 'cyan');
    log('', 'reset');
    log('📱 PRÓXIMOS PASSOS:', 'blue');
    log('   1. Abra o link no navegador', 'cyan');
    log('   2. Preencha os dados do cartão', 'cyan');
    log('   3. Complete o pagamento', 'cyan');
    log('   4. Verifique o webhook no backend', 'cyan');
  } else {
    log('❌ COMPRA NÃO FOI GERADA', 'red');
    log('', 'reset');
    log('🔧 POSSÍVEIS PROBLEMAS:', 'yellow');
    log('   • Backend não está online', 'red');
    log('   • Banco não tem produtos', 'red');
    log('   • Token de usuário inválido', 'red');
    log('   • Configuração Stripe incorreta', 'red');
    log('', 'reset');
    log('💡 SOLUÇÕES:', 'blue');
    log('   1. Verifique se o backend está no ar', 'cyan');
    log('   2. Execute seed para popular produtos', 'cyan');
    log('   3. Obtenha token válido via Google OAuth', 'cyan');
    log('   4. Configure STRIPE_SECRET_KEY no Heroku', 'cyan');
  }
  
  log('', 'reset');
  log(`⏰ Finalizado em: ${new Date().toLocaleString()}`, 'cyan');
}

/**
 * EXECUÇÃO PRINCIPAL
 */
async function main() {
  log('🛒 GERADOR DE COMPRA STRIPE - PRODUÇÃO', 'bold');
  log('💳 Demonstração completa: Login → Produtos → Compra → Stripe', 'cyan');
  log(`⏰ Início: ${new Date().toLocaleString()}`, 'cyan');
  
  try {
    // 1. Login admin
    const loginSucesso = await loginAdmin();
    if (!loginSucesso) {
      log('\n❌ Falha no login admin. Abortando...', 'red');
      process.exit(1);
    }
    
    await delay(1000);
    
    // 2. Buscar produtos
    const produtosSucesso = await buscarProdutos();
    if (!produtosSucesso) {
      log('\n⚠️  Nenhum produto encontrado. Continuando...', 'yellow');
    }
    
    await delay(1000);
    
    // 3. Obter token usuário
    const tokenSucesso = await obterTokenUsuario();
    
    await delay(1000);
    
    // 4. Criar compra Stripe
    if (produtos.length > 0) {
      await criarCompraStripe();
    } else {
      log('\n❌ Sem produtos para compra!', 'red');
    }
    
    await delay(1000);
    
    // 5. Relatório final
    await gerarRelatorioFinal();
    
  } catch (error) {
    log(`\n❌ Erro durante execução: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { main };
