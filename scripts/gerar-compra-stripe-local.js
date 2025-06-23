#!/usr/bin/env node

/**
 * 🛒 GERAR COMPRA STRIPE COMPLETA - USANDO BACKEND DE PRODUÇÃO
 * 
 * OBJETIVO: Criar uma compra completa com Stripe usando o backend de produção
 * 1. Login como usuário (com token fornecido)
 * 2. Buscar produtos disponíveis
 * 3. Criar sessão de checkout Stripe
 * 4. Gerar link de pagamento para teste
 * 
 * VERSÃO: 2.0 - Backend de Produção (Token funciona aqui!)
 * USO: node scripts/gerar-compra-stripe-local.js
 */

const axios = require('axios');
const readline = require('readline');

// ===== CONFIGURAÇÕES BACKEND DE PRODUÇÃO =====
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
let userToken = null;
let produtos = [];
let checkoutSessionId = null;
let checkoutUrl = null;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 1. OBTER TOKEN DE USUÁRIO
 */
async function obterTokenUsuario() {
  logSection('ETAPA 1: OBTER TOKEN DE USUÁRIO');
  
  log('👤 Para fazer uma compra, precisamos do seu token de usuário', 'yellow');
  log('', 'reset');
  log('📋 COMO OBTER O TOKEN:', 'blue');
  log('   1. Faça login via frontend ou Postman', 'cyan');
  log('   2. Copie o token JWT retornado', 'cyan');
  log('   3. Cole o token aqui', 'cyan');
  log('', 'reset');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('📝 Cole o token JWT do usuário: ', (token) => {
      if (token && token.length > 50) {
        userToken = token.trim();
        if (userToken.startsWith('Bearer ')) {
          userToken = userToken.substring(7);
        }
        
        log('✅ Token de usuário configurado!', 'green');
        log(`🎫 Token: ${userToken.substring(0, 30)}...`, 'cyan');
        
        // Tentar decodificar o token
        try {
          const payload = JSON.parse(Buffer.from(userToken.split('.')[1], 'base64').toString());
          log(`👤 Usuário: ${payload.email || 'N/A'}`, 'cyan');
          log(`🆔 ID: ${payload.sub || payload.id || 'N/A'}`, 'cyan');
          log(`🔑 Roles: ${payload.roles ? payload.roles.join(', ') : 'N/A'}`, 'cyan');
        } catch (e) {
          log('⚠️  Token válido, mas não foi possível decodificar completamente', 'yellow');
        }
        
        rl.close();
        resolve(true);
      } else {
        log('❌ Token inválido! Deve ter mais de 50 caracteres', 'red');
        rl.close();
        resolve(false);
      }
    });
  });
}

/**
 * 2. BUSCAR PRODUTOS
 */
async function buscarProdutos() {
  logSection('ETAPA 2: BUSCAR PRODUTOS');
  
  log('📦 Buscando produtos no backend local...', 'yellow');
  
  const endpoints = [
    '/sales/public/products',
    '/products', 
    '/catalog/products',
    '/admin/products'
  ];
  
  for (const endpoint of endpoints) {
    try {
      log(`🔍 Testando: GET ${endpoint}`, 'cyan');
      
      const headers = userToken ? {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      } : { 'Content-Type': 'application/json' };
      
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        headers,
        timeout: 10000
      });
      
      if (response.status === 200 && response.data) {
        let produtosData = Array.isArray(response.data) ? response.data : 
                          response.data.produtos || response.data.data || response.data.products || [];
        
        if (produtosData.length > 0) {
          produtos = produtosData.slice(0, 5).map(p => ({
            id: p.id || p.productId,
            nome: p.nome || p.name || p.title,
            preco: parseFloat(p.preco || p.price || 10.00),
            descricao: p.descricao || p.description || '',
            categoria: p.categoria || p.category || 'Geral',
            loja: p.estabelecimento?.nome || p.loja || p.store || 'Loja Padrão',
            estoque: p.estoque || p.stockQuantity || p.stock || 99
          }));
          
          log(`✅ ${produtos.length} produtos encontrados via ${endpoint}!`, 'green');
          log('', 'reset');
          
          log('🛍️ PRODUTOS SELECIONADOS PARA COMPRA:', 'blue');
          produtos.forEach((produto, index) => {
            log(`   ${index + 1}. ${produto.nome}`, 'cyan');
            log(`      💰 R$ ${produto.preco.toFixed(2)}`, 'cyan');
            log(`      🏪 ${produto.loja}`, 'cyan');
            log(`      📂 ${produto.categoria}`, 'cyan');
            if (produto.descricao) {
              log(`      📝 ${produto.descricao.substring(0, 50)}...`, 'cyan');
            }
            log('', 'reset');
          });
          
          return true;
        }
      }
    } catch (error) {
      log(`   ❌ Erro: ${error.message}`, 'red');
      if (error.response?.status === 401) {
        log(`   🔑 Endpoint requer autenticação`, 'yellow');
      }
    }
  }
  
  log('❌ Não foi possível encontrar produtos!', 'red');
  log('💡 Certifique-se de que o backend está rodando e tem produtos no banco', 'yellow');
  return false;
}

/**
 * 3. CRIAR COMPRA STRIPE
 */
async function criarCompraStripe() {
  logSection('ETAPA 3: CRIAR COMPRA STRIPE');
  
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
    enderecoEntrega: 'Rua Teste Local, 123 - Centro - São Paulo/SP - CEP: 01010-000',
    observacoes: 'Compra de teste - Desenvolvimento Local Stripe',
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
    // Usar apenas o endpoint correto
  const endpoints = [
    '/payment/create-checkout-session'
  ];
  
  for (const endpoint of endpoints) {
    try {
      log(`🔄 Tentando criar sessão Stripe via ${endpoint}...`, 'yellow');
      
      const headers = {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      };
      
      const response = await axios.post(`${BASE_URL}${endpoint}`, dadosCompra, {
        headers,
        timeout: 15000
      });
      
      if (response.status === 200 || response.status === 201) {
        const data = response.data;
        
        if (data.sessionId || data.checkoutUrl || data.url) {
          checkoutSessionId = data.sessionId || data.session_id;
          checkoutUrl = data.checkoutUrl || data.url || data.checkout_url;
          
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
          log('   • Nome: João da Silva', 'cyan');
          log('   • Email: joao@teste.com', 'cyan');
          log('', 'reset');
          log('📋 RESUMO DA COMPRA:', 'blue');
          if (checkoutSessionId) {
            log(`   🆔 Session ID: ${checkoutSessionId}`, 'cyan');
          }
          log(`   💰 Valor: R$ ${valorTotal.toFixed(2)}`, 'cyan');
          log(`   📦 Produtos: ${itensCompra.length}`, 'cyan');
          log(`   🏪 Lojas: ${[...new Set(itensCompra.map(i => i.loja))].join(', ')}`, 'cyan');
          log(`   🌐 Endpoint usado: ${endpoint}`, 'cyan');
          
          return true;
        } else {
          log('❌ Resposta sem Session ID ou URL!', 'red');
          log(`   Resposta: ${JSON.stringify(data, null, 2)}`, 'yellow');
        }
      } else {
        log(`   ❌ Status ${response.status}: ${response.statusText}`, 'red');
      }
    } catch (error) {
      log(`   ❌ Erro: ${error.message}`, 'red');
      
      if (error.response) {
        log(`   Status: ${error.response.status}`, 'red');
        
        if (error.response.status === 401) {
          log('   🔑 Token de usuário inválido ou expirado!', 'yellow');
        } else if (error.response.status === 404) {
          log('   🔍 Endpoint não encontrado', 'yellow');
        } else if (error.response.status === 400) {
          log('   📝 Dados da requisição inválidos', 'yellow');
          log(`   Detalhes: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
        }
      }
    }
  }
  
  log('❌ Não foi possível criar a sessão Stripe em nenhum endpoint!', 'red');
  return false;
}

/**
 * 4. RELATÓRIO FINAL
 */
async function gerarRelatorioFinal() {
  logSection('RELATÓRIO FINAL - COMPRA STRIPE LOCAL');
  
  if (checkoutUrl) {
    log('🎯 COMPRA GERADA COM SUCESSO!', 'bold');
    log('', 'reset');
    log('✅ ETAPAS CONCLUÍDAS:', 'green');
    log('   1. ✅ Token de usuário configurado', 'green');
    log('   2. ✅ Produtos carregados do banco', 'green');
    log('   3. ✅ Sessão Stripe criada', 'green');
    log('   4. ✅ Link de pagamento gerado', 'green');
    log('', 'reset');
    log('🔗 LINK PARA TESTE:', 'bold');
    log('', 'reset');
    log(`${checkoutUrl}`, 'cyan');
    log('', 'reset');
    log('💳 DADOS PARA TESTE STRIPE:', 'yellow');
    log('   • Número: 4242 4242 4242 4242', 'cyan');
    log('   • Validade: 12/30', 'cyan');
    log('   • CVC: 123', 'cyan');
    log('   • Nome: João da Silva', 'cyan');
    log('   • Email: joao@teste.com', 'cyan');
    log('', 'reset');
    log('📱 PRÓXIMOS PASSOS:', 'blue');
    log('   1. Copie e abra o link no navegador', 'cyan');
    log('   2. Preencha os dados do cartão de teste', 'cyan');
    log('   3. Complete o pagamento', 'cyan');
    log('   4. Verifique os logs do backend para webhooks', 'cyan');
    log('   5. Confira se a compra foi salva no banco', 'cyan');
  } else {
    log('❌ COMPRA NÃO FOI GERADA', 'red');
    log('', 'reset');
    log('🔧 POSSÍVEIS PROBLEMAS:', 'yellow');
    log('   • Backend não está rodando (http://localhost:3000)', 'red');
    log('   • Banco não tem produtos populados', 'red');
    log('   • Token de usuário inválido ou expirado', 'red');
    log('   • Endpoint de pagamento não implementado', 'red');
    log('   • Configuração Stripe não está configurada', 'red');
    log('', 'reset');
    log('💡 SOLUÇÕES:', 'blue');
    log('   1. Inicie o backend: npm run start:dev', 'cyan');
    log('   2. Execute seeds: npm run seed', 'cyan');
    log('   3. Obtenha token válido fazendo login', 'cyan');
    log('   4. Configure STRIPE_SECRET_KEY no .env', 'cyan');
    log('   5. Verifique os endpoints de pagamento', 'cyan');
  }
  
  log('', 'reset');
  log(`⏰ Finalizado em: ${new Date().toLocaleString()}`, 'cyan');
}

/**
 * EXECUÇÃO PRINCIPAL
 */
async function main() {
  log('🛒 GERADOR DE COMPRA STRIPE - AMBIENTE LOCAL', 'bold');
  log('💳 Teste completo: Token → Produtos → Compra → Stripe', 'cyan');
  log(`⏰ Início: ${new Date().toLocaleString()}`, 'cyan');
  log(`🌐 Backend: ${BASE_URL}`, 'cyan');
  
  try {
    // 1. Obter token usuário
    const tokenSucesso = await obterTokenUsuario();
    if (!tokenSucesso) {
      log('\n❌ Token de usuário necessário. Abortando...', 'red');
      process.exit(1);
    }
    
    await delay(1000);
    
    // 2. Buscar produtos
    const produtosSucesso = await buscarProdutos();
    if (!produtosSucesso) {
      log('\n⚠️  Nenhum produto encontrado. Verifique se o banco está populado.', 'yellow');
      log('💡 Execute: npm run seed', 'cyan');
      process.exit(1);
    }
    
    await delay(1000);
    
    // 3. Criar compra Stripe
    if (produtos.length > 0) {
      await criarCompraStripe();
    } else {
      log('\n❌ Sem produtos para compra!', 'red');
    }
    
    await delay(1000);
    
    // 4. Relatório final
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
