/**
 * 🧪 SEED DE TESTE - CHECKOUT STRIPE EM PRODUÇÃO
 * 
 * Esta seed testa especificamente o fluxo de checkout com Stripe
 * - Usa o backend em produção no Heroku
 * - Solicita token do usuário interativamente
 * - Simula uma compra completa
 * - Retorna link da página de checkout do Stripe
 *  * ENDPOINTS TESTADOS:
 * • GET /products - Buscar produtos disponíveis (endpoint correto)
 * • POST /payment/create-checkout-session - Criar sessão de checkout
 * 
 * VERSÃO: 1.1 - Teste de produção corrigido
 * USO: node scripts/test-stripe-checkout-production.js
 */

const axios = require('axios');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// ===== CONFIGURAÇÕES PRODUÇÃO =====
const BASE_URL = 'https://meu-ze-da-fruta-backend-8c4976f28553.herokuapp.com';
const FRONTEND_URL = 'https://ze-da-futa-frony.vercel.app';

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
let userToken = null;
let userId = null;
let produtos = [];
let checkoutSessionId = null;
let checkoutUrl = null;
let testResults = [];

// Função para aguardar um tempo
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 1. VERIFICAR SERVIDOR EM PRODUÇÃO
 */
async function verificarServidor() {
  logSection('VERIFICAÇÃO DO SERVIDOR EM PRODUÇÃO');
  
  log('🔍 Verificando se o backend em produção está online...', 'yellow');
  log(`🔗 URL: ${BASE_URL}`, 'cyan');
  
  try {
    const response = await axios.get(`${BASE_URL}/api`, { timeout: 15000 });
    
    if (response.status === 200) {
      log('✅ Backend em produção está online e respondendo!', 'green');
      log(`📊 Status: ${response.status}`, 'cyan');
      return true;
    } else {
      log(`⚠️  Backend respondeu com status: ${response.status}`, 'yellow');
      return false;
    }
  } catch (error) {
    log('❌ Backend em produção não está respondendo!', 'red');
    log(`   Erro: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
    }
    return false;
  }
}

/**
 * 2. SOLICITAR TOKEN DO USUÁRIO
 */
async function solicitarTokenUsuario() {
  logSection('ETAPA 1: OBTENÇÃO DO TOKEN DE USUÁRIO');
  
  log('🔑 FAÇA LOGIN COMO USUÁRIO PARA OBTER O TOKEN', 'yellow');
  log('', 'reset');
  log('🔗 LINK PARA LOGIN:', 'bold');
  log(`   ${BASE_URL}/auth/google`, 'cyan');
  log('', 'reset');
  log('📋 INSTRUÇÕES:', 'blue');
  log('   1. Abra o link acima no navegador', 'cyan');
  log('   2. Complete o login com Google', 'cyan');
  log('   3. Copie o token JWT retornado', 'cyan');
  log('   4. Cole o token aqui abaixo', 'cyan');
  log('', 'reset');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('📝 Token do usuário: ', (token) => {
      if (token && token.length > 50) {
        // Limpar token se tiver "Bearer " no início
        if (token.startsWith('Bearer ')) {
          token = token.substring(7);
        }
        
        userToken = token.trim();
        
        // Extrair ID do usuário do token
        try {
          const payload = JSON.parse(Buffer.from(userToken.split('.')[1], 'base64').toString());
          userId = payload.sub || payload.id || 'unknown';
          
          log('✅ Token configurado com sucesso!', 'green');
          log(`   Token: ${userToken.substring(0, 30)}...`, 'cyan');
          log(`   ID do usuário: ${userId}`, 'cyan');
          log(`   Email: ${payload.email || 'N/A'}`, 'cyan');
          
          testResults.push({
            teste: 'Obtenção de Token',
            status: 'SUCESSO',
            detalhes: `Token válido para usuário ${payload.email || userId}`
          });
          
          resolve(true);
        } catch (e) {
          log('⚠️  Token configurado, mas não foi possível decodificar completamente', 'yellow');
          testResults.push({
            teste: 'Obtenção de Token',
            status: 'SUCESSO_PARCIAL',
            detalhes: 'Token configurado mas não decodificado completamente'
          });
          resolve(true);
        }
      } else {
        log('❌ Token inválido ou muito curto!', 'red');
        log('   O token deve ter mais de 50 caracteres', 'yellow');
        testResults.push({
          teste: 'Obtenção de Token',
          status: 'FALHA',
          detalhes: 'Token inválido ou muito curto'
        });
        resolve(false);
      }
      rl.close();
    });
  });
}

/**
 * 3. BUSCAR PRODUTOS DISPONÍVEIS
 */
async function buscarProdutos() {
  logSection('ETAPA 2: BUSCAR PRODUTOS DISPONÍVEIS');
  
  log('📦 Buscando produtos disponíveis para compra...', 'yellow');
    try {
    // Testar diferentes endpoints de produtos
    const endpoints = [
      '/products',
      '/sales/public/products', 
      '/catalog/products'
    ];
    
    let produtosEncontrados = [];
    let endpointFuncionando = null;
    
    for (const endpoint of endpoints) {
      log(`🔍 Testando endpoint: ${endpoint}`, 'cyan');
      
      try {
        const response = await axios.get(`${BASE_URL}${endpoint}`, { 
          timeout: 15000 
        });
        
        if (response.status === 200 && response.data) {
          const produtosData = Array.isArray(response.data) ? response.data : 
                              (response.data.data ? response.data.data : 
                              (response.data.produtos ? response.data.produtos : []));
          
          if (produtosData.length > 0) {
            produtosEncontrados = produtosData.filter(p => 
              (p.isActive !== false) && 
              (p.ativo !== false) && 
              (p.stockQuantity > 0 || p.estoque > 0 || !p.stockQuantity)
            ).slice(0, 5);
            
            if (produtosEncontrados.length > 0) {
              endpointFuncionando = endpoint;
              log(`✅ Endpoint funcionando: ${endpoint}`, 'green');
              break;
            }
          }
        }
      } catch (endpointError) {
        log(`❌ Endpoint não funcionou: ${endpoint} (Status: ${endpointError.response?.status || endpointError.message})`, 'red');
      }
    }
    
    if (produtosEncontrados.length > 0) {
      produtos = produtosEncontrados;
      log(`✅ ${produtos.length} produtos encontrados via ${endpointFuncionando}!`, 'green');
      
      log('\n🛍️ PRODUTOS DISPONÍVEIS:', 'blue');
      produtos.forEach((produto, index) => {
        const nome = produto.name || produto.nome || 'Produto sem nome';
        const preco = produto.price || produto.preco || 0;
        const estoque = produto.stockQuantity || produto.estoque || 'N/A';
        const loja = produto.establishmentName || produto.estabelecimento || 'N/A';
        
        log(`   ${index + 1}. ${nome}`, 'cyan');
        log(`      💰 Preço: R$ ${preco}`, 'cyan');
        log(`      📦 Estoque: ${estoque}`, 'cyan');
        log(`      🏪 Loja: ${loja}`, 'cyan');
        log('', 'reset');
      });
      
      testResults.push({
        teste: 'Buscar Produtos',
        status: 'SUCESSO',
        detalhes: `${produtos.length} produtos encontrados via ${endpointFuncionando}`
      });
      
      return true;
    } else {
      log('❌ Nenhum produto encontrado em nenhum endpoint!', 'red');
      testResults.push({
        teste: 'Buscar Produtos',
        status: 'FALHA',
        detalhes: 'Nenhum produto disponível encontrado'
      });
      return false;
    }
  } catch (error) {
    log(`❌ Erro ao buscar produtos: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Resposta: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    testResults.push({
      teste: 'Buscar Produtos',
      status: 'FALHA',
      detalhes: `Erro: ${error.message}`
    });
    return false;
  }
}

/**
 * 4. CRIAR SESSÃO DE CHECKOUT STRIPE
 */
async function criarCheckoutStripe() {
  logSection('ETAPA 3: CRIAR SESSÃO DE CHECKOUT STRIPE');
  
  if (produtos.length === 0) {
    log('❌ Nenhum produto disponível para checkout', 'red');
    testResults.push({
      teste: 'Criar Checkout Stripe',
      status: 'FALHA',
      detalhes: 'Nenhum produto disponível'
    });
    return false;
  }
  
  // Selecionar os primeiros 2 produtos para o carrinho
  const produtosSelecionados = produtos.slice(0, 2);
  
  const headers = {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  };
    // Dados do pedido para checkout
  const dadosCheckout = {
    itens: produtosSelecionados.map(produto => {
      const id = produto.productId || produto.id || 'produto-' + Date.now();
      const nome = produto.name || produto.nome || 'Produto';
      const preco = produto.price || produto.preco || 10.00;
      
      return {
        produtoId: id,
        quantidade: 1,
        preco: preco,
        nome: nome
      };
    }),
    enderecoEntrega: 'Rua Teste Stripe Produção, 123 - Centro - São Paulo/SP - CEP: 01010-000',
    observacoes: 'Teste de checkout Stripe em produção via seed',
    metodoPagamento: 'STRIPE_CHECKOUT'
  };
  
  log('🛒 DADOS DO CARRINHO:', 'blue');
  log(`   📦 Produtos: ${dadosCheckout.itens.length}`, 'cyan');
  dadosCheckout.itens.forEach((item, index) => {
    log(`      ${index + 1}. ${item.nome} - R$ ${item.preco} (Qtd: ${item.quantidade})`, 'cyan');
  });
  log(`   📍 Endereço: ${dadosCheckout.enderecoEntrega}`, 'cyan');
  
  const valorTotal = dadosCheckout.itens.reduce((total, item) => total + (item.preco * item.quantidade), 0);
  log(`   💰 Total: R$ ${valorTotal.toFixed(2)}`, 'cyan');
  
  log('\n🔄 Criando sessão de checkout no Stripe...', 'yellow');
  
  try {
    const response = await axios.post(`${BASE_URL}/payment/create-checkout-session`, dadosCheckout, {
      headers,
      timeout: 30000
    });
    
    if (response.status === 200 || response.status === 201) {
      const sessionId = response.data.sessionId || response.data.session_id || response.data.id;
      
      if (sessionId) {
        checkoutSessionId = sessionId;
        
        // Gerar URL do Stripe Checkout
        checkoutUrl = `https://checkout.stripe.com/pay/${sessionId}`;
        
        log('🎉 CHECKOUT STRIPE CRIADO COM SUCESSO!', 'green');
        log('', 'reset');
        log('='.repeat(70), 'magenta');
        log('🔗 LINK DA PÁGINA DE PAGAMENTO STRIPE:', 'bold');
        log('', 'reset');
        log(`${checkoutUrl}`, 'cyan');
        log('', 'reset');
        log('='.repeat(70), 'magenta');
        log('', 'reset');
        log('💳 DADOS PARA TESTE:', 'yellow');
        log('   • Número do cartão: 4242 4242 4242 4242', 'cyan');
        log('   • Validade: Qualquer data futura (ex: 12/30)', 'cyan');
        log('   • CVC: Qualquer 3 dígitos (ex: 123)', 'cyan');
        log('   • Nome: Qualquer nome', 'cyan');
        log('', 'reset');
        log('🔍 COMO TESTAR:', 'blue');
        log('   1. Abra o link acima no navegador', 'cyan');
        log('   2. Preencha com os dados de teste', 'cyan');
        log('   3. Complete o pagamento', 'cyan');
        log('   4. Será redirecionado para:', 'cyan');
        log(`      ✅ Sucesso: ${FRONTEND_URL}/pagamento/sucesso`, 'green');
        log(`      ❌ Cancelar: ${FRONTEND_URL}/pagamento/cancelado`, 'red');
        
        testResults.push({
          teste: 'Criar Checkout Stripe',
          status: 'SUCESSO',
          detalhes: `Session ID: ${sessionId}`,
          checkoutUrl: checkoutUrl,
          valorTotal: valorTotal
        });
        
        return true;
      } else {
        log('❌ Session ID não retornado pelo Stripe', 'red');
        log(`   Resposta: ${JSON.stringify(response.data, null, 2)}`, 'yellow');
        testResults.push({
          teste: 'Criar Checkout Stripe',
          status: 'FALHA',
          detalhes: 'Session ID não retornado'
        });
        return false;
      }
    } else {
      log(`❌ Status inesperado: ${response.status}`, 'red');
      testResults.push({
        teste: 'Criar Checkout Stripe',
        status: 'FALHA',
        detalhes: `Status inesperado: ${response.status}`
      });
      return false;
    }
  } catch (error) {
    log(`❌ Erro ao criar checkout: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Resposta: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    testResults.push({
      teste: 'Criar Checkout Stripe',
      status: 'FALHA',
      detalhes: `Erro: ${error.message}`,
      httpStatus: error.response?.status
    });
    return false;
  }
}

/**
 * 5. VERIFICAR CONFIGURAÇÕES STRIPE
 */
async function verificarConfiguracoesStripe() {
  logSection('VERIFICAÇÃO DAS CONFIGURAÇÕES STRIPE');
  
  log('🔧 Verificando endpoints de pagamento...', 'yellow');
  
  // Testar endpoint webhook
  try {
    const webhookTest = await axios.post(`${BASE_URL}/payment/webhook/stripe`, 
      { test: true }, 
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
        validateStatus: () => true // Aceitar qualquer status
      }
    );
    
    if (webhookTest.status === 400 || webhookTest.status === 401) {
      log('✅ Webhook endpoint está configurado e respondendo', 'green');
      testResults.push({
        teste: 'Webhook Endpoint',
        status: 'SUCESSO',
        detalhes: 'Endpoint configurado e acessível'
      });
    } else if (webhookTest.status === 404) {
      log('❌ Webhook endpoint não encontrado', 'red');
      testResults.push({
        teste: 'Webhook Endpoint',
        status: 'FALHA',
        detalhes: 'Endpoint não encontrado (404)'
      });
    } else {
      log(`⚠️  Webhook endpoint resposta: ${webhookTest.status}`, 'yellow');
      testResults.push({
        teste: 'Webhook Endpoint',
        status: 'SUCESSO_PARCIAL',
        detalhes: `Endpoint responde com status ${webhookTest.status}`
      });
    }
  } catch (error) {
    log(`❌ Erro ao testar webhook: ${error.message}`, 'red');
    testResults.push({
      teste: 'Webhook Endpoint',
      status: 'FALHA',
      detalhes: `Erro: ${error.message}`
    });
  }
  
  log('\n🔗 URLs CONFIGURADAS:', 'blue');
  log(`   Backend: ${BASE_URL}`, 'cyan');
  log(`   Frontend: ${FRONTEND_URL}`, 'cyan');
  log(`   Webhook: ${BASE_URL}/payment/webhook/stripe`, 'cyan');
  log(`   Sucesso: ${FRONTEND_URL}/pagamento/sucesso`, 'cyan');
  log(`   Cancelar: ${FRONTEND_URL}/pagamento/cancelado`, 'cyan');
}

/**
 * 6. INSTRUÇÕES DE MONITORAMENTO
 */
async function mostrarInstrucoesMonitoramento() {
  logSection('INSTRUÇÕES PARA MONITORAMENTO');
  
  log('📊 Para monitorar webhooks em tempo real:', 'yellow');
  log('', 'reset');
  log('   Execute em outro terminal:', 'cyan');
  log('   heroku logs --tail -a meu-ze-da-fruta-backend', 'bold');
  log('', 'reset');
  log('   Ou filtre apenas logs de pagamento (Windows):', 'cyan');
  log('   heroku logs --tail -a meu-ze-da-fruta-backend | findstr "stripe payment webhook"', 'bold');
  log('', 'reset');
  log('   Ou filtre apenas logs de pagamento (Git Bash):', 'cyan');
  log('   heroku logs --tail -a meu-ze-da-fruta-backend | grep -i "stripe\\|payment\\|webhook"', 'bold');
  log('', 'reset');
  log('💡 Quando processar um pagamento, você verá:', 'blue');
  log('   • Logs do webhook sendo chamado', 'cyan');
  log('   • Eventos processados (checkout.session.completed)', 'cyan');
  log('   • Atualizações de status de pedido', 'cyan');
}

/**
 * 7. RELATÓRIO FINAL
 */
async function gerarRelatorioFinal() {
  logSection('RELATÓRIO FINAL - TESTE DE CHECKOUT STRIPE');
  
  const sucessos = testResults.filter(r => r.status === 'SUCESSO').length;
  const sucessosParciais = testResults.filter(r => r.status === 'SUCESSO_PARCIAL').length;
  const falhas = testResults.filter(r => r.status === 'FALHA').length;
  const total = testResults.length;
  const taxaSucesso = total > 0 ? ((sucessos + sucessosParciais * 0.5) / total * 100).toFixed(1) : 0;
  
  log(`📊 RESULTADOS DOS TESTES:`, 'bold');
  log(`   Total de testes: ${total}`, 'cyan');
  log(`   ✅ Sucessos: ${sucessos}`, 'green');
  log(`   ⚠️  Sucessos parciais: ${sucessosParciais}`, 'yellow');
  log(`   ❌ Falhas: ${falhas}`, 'red');
  log(`   📈 Taxa de sucesso: ${taxaSucesso}%`, 'cyan');
  
  log('\n📋 DETALHES DOS TESTES:', 'blue');
  testResults.forEach((result, index) => {
    const icon = result.status === 'SUCESSO' ? '✅' : 
                 result.status === 'SUCESSO_PARCIAL' ? '⚠️' : '❌';
    log(`   ${index + 1}. ${icon} ${result.teste}: ${result.status}`, 'cyan');
    log(`      ${result.detalhes}`, 'reset');
  });
  
  if (checkoutSessionId && checkoutUrl) {
    log('\n🎯 PRÓXIMOS PASSOS:', 'bold');
    log('   1. ✅ Sessão de checkout criada com sucesso', 'green');
    log('   2. 🔗 Use a URL do Stripe fornecida para testar', 'cyan');
    log('   3. 💳 Use cartão de teste: 4242 4242 4242 4242', 'cyan');
    log('   4. 📊 Monitore os logs do Heroku para ver webhooks', 'cyan');
    log('   5. ✅ Confirme redirecionamento para frontend', 'cyan');
    log('', 'reset');
    log('🔗 LINK DIRETO PARA CHECKOUT:', 'bold');
    log(`   ${checkoutUrl}`, 'cyan');
  }
  
  const status = taxaSucesso >= 80 ? 'APROVADO' : 'NECESSITA AJUSTES';
  const statusColor = taxaSucesso >= 80 ? 'green' : 'yellow';
  
  log(`\n🏆 STATUS FINAL: ${status}`, statusColor);
  
  if (taxaSucesso < 80) {
    log('\n⚠️  AÇÕES NECESSÁRIAS:', 'yellow');
    testResults.filter(r => r.status === 'FALHA').forEach(result => {
      log(`   • ${result.teste}: ${result.detalhes}`, 'red');
    });
  }

  // Salvar relatório em arquivo
  const relatorio = {
    timestamp: new Date().toISOString(),
    backend: BASE_URL,
    frontend: FRONTEND_URL,
    resumo: {
      total,
      sucessos,
      sucessosParciais,
      falhas,
      taxaSucesso: taxaSucesso + '%'
    },
    checkout: {
      sessionId: checkoutSessionId,
      url: checkoutUrl,
      produtos: produtos.slice(0, 2).map(p => ({ 
        nome: p.name, 
        preco: p.price 
      }))
    },
    resultados: testResults
  };

  const relatorioPath = path.join(__dirname, 'relatorio-stripe-checkout-production.json');
  fs.writeFileSync(relatorioPath, JSON.stringify(relatorio, null, 2));
  log(`\n📄 Relatório salvo em: ${relatorioPath}`, 'cyan');
}

/**
 * FUNÇÃO PRINCIPAL
 */
async function executarTesteStripeProducao() {
  try {
    log('🚀 TESTE DE CHECKOUT STRIPE EM PRODUÇÃO - ZÉ DA FRUTA', 'bold');
    log('==============================================================', 'cyan');
    log(`🔗 Backend: ${BASE_URL}`, 'cyan');
    log(`🌐 Frontend: ${FRONTEND_URL}`, 'cyan');
    log(`⏰ Início: ${new Date().toLocaleString()}`, 'cyan');
    
    // Verificar servidor
    const servidorOnline = await verificarServidor();
    if (!servidorOnline) {
      log('❌ Teste interrompido: servidor offline', 'red');
      process.exit(1);
    }
    
    await delay(500);
    
    // Solicitar token do usuário
    const tokenObtido = await solicitarTokenUsuario();
    if (!tokenObtido) {
      log('❌ Teste interrompido: token inválido', 'red');
      process.exit(1);
    }
    
    await delay(500);
    
    // Buscar produtos
    const produtosEncontrados = await buscarProdutos();
    
    await delay(500);
    
    // Verificar configurações
    await verificarConfiguracoesStripe();
    
    await delay(500);
    
    // Criar checkout (principal objetivo)
    if (produtosEncontrados) {
      await criarCheckoutStripe();
    }
    
    await delay(500);
    
    // Instruções de monitoramento
    await mostrarInstrucoesMonitoramento();
    
    // Relatório final
    await gerarRelatorioFinal();
    
    log('\n🎉 TESTE DE CHECKOUT STRIPE CONCLUÍDO!', 'bold');
    
  } catch (error) {
    log(`❌ Erro fatal: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Verificar se foi chamado diretamente
if (require.main === module) {
  executarTesteStripeProducao();
}

module.exports = {
  executarTesteStripeProducao,
  verificarServidor,
  solicitarTokenUsuario,
  buscarProdutos,
  criarCheckoutStripe,
  verificarConfiguracoesStripe
};
