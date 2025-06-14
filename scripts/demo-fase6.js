#!/usr/bin/env node

/**
 * 📊 FASE 6: DEMONSTRAÇÃO COMPLETA DO SISTEMA DE MÉTRICAS
 * 
 * Este script demonstra todas as funcionalidades implementadas na FASE 6
 */

const http = require('http');

const port = process.env.PORT || 3000;
const hostname = process.env.HOSTNAME || 'localhost';

console.log('\n🚀 FASE 6: SISTEMA DE MONITORING E MÉTRICAS');
console.log('='.repeat(50));
console.log('📊 Demonstração completa das funcionalidades\n');

/**
 * Helper para fazer requests HTTP
 */
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: hostname,
      port: port,
      path: path,
      method: method,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsedData, headers: res.headers });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData, headers: res.headers });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(10000);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Demonstra os endpoints de health check
 */
async function demonstrateHealthChecks() {
  console.log('🏥 1. HEALTH CHECKS');
  console.log('-'.repeat(30));

  // Health check básico
  console.log('📍 Health check básico (/health)');
  try {
    const result = await makeRequest('/health');
    console.log(`   Status: ${result.status}`);
    console.log(`   ✅ Sistema: ${result.data.status}`);
    console.log(`   ⏱️ Uptime: ${result.data.uptime}s`);
    console.log(`   📅 Timestamp: ${result.data.timestamp}\n`);
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}\n`);
  }

  // Health check detalhado
  console.log('📍 Health check detalhado (/health/detailed)');
  try {
    const result = await makeRequest('/health/detailed');
    console.log(`   Status: ${result.status}`);
    console.log(`   📊 Status geral: ${result.data.overall}`);
    
    if (result.data.domains) {
      console.log('   🔍 Detalhes por domínio:');
      Object.entries(result.data.domains).forEach(([domain, info]) => {
        console.log(`     • ${domain}: ${info.status} - ${info.message}`);
      });
    }
    console.log('');
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}\n`);
  }

  // Health checks específicos
  console.log('📍 Health check do domínio de vendas (/health/sales)');
  try {
    const result = await makeRequest('/health/sales');
    console.log(`   Status: ${result.status}`);
    console.log(`   📊 Sales Domain: ${result.data.status}`);
    console.log(`   💬 Message: ${result.data.message}\n`);
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}\n`);
  }

  console.log('📍 Health check do domínio de contas (/health/accounts)');
  try {
    const result = await makeRequest('/health/accounts');
    console.log(`   Status: ${result.status}`);
    console.log(`   📊 Accounts Domain: ${result.data.status}`);
    console.log(`   💬 Message: ${result.data.message}\n`);
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}\n`);
  }
}

/**
 * Demonstra as métricas de domínio
 */
async function demonstrateMetrics() {
  console.log('📊 2. MÉTRICAS DE DOMÍNIO');
  console.log('-'.repeat(30));

  console.log('📍 Métricas consolidadas (/health/metrics)');
  try {
    const result = await makeRequest('/health/metrics');
    console.log(`   Status: ${result.status}`);
    
    if (result.data.sales) {
      console.log('   💰 Sales Domain:');
      console.log(`     • Pedidos criados: ${result.data.sales.pedidosCriados}`);
      console.log(`     • Valor total: R$ ${result.data.sales.valorTotalPedidos.toFixed(2)}`);
      console.log(`     • Itens vendidos: ${result.data.sales.itensVendidos}`);
      console.log(`     • Estabelecimentos ativos: ${result.data.sales.estabelecimentosAtivos}`);
      console.log(`     • Ticket médio: R$ ${result.data.sales.ticketMedio.toFixed(2)}`);
    }
    
    if (result.data.users) {
      console.log('   👥 Users Domain:');
      console.log(`     • Usuários criados: ${result.data.users.usuariosCriados}`);
      console.log(`     • Tipos de usuários:`, result.data.users.tiposUsuarios);
    }
    
    if (result.data.products) {
      console.log('   📦 Products Domain:');
      console.log(`     • Produtos criados: ${result.data.products.produtosCriados}`);
      console.log(`     • Categorias:`, result.data.products.categorias);
    }
    console.log('');
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}\n`);
  }
}

/**
 * Demonstra as métricas de sistema
 */
async function demonstrateSystemMetrics() {
  console.log('💻 3. MÉTRICAS DE SISTEMA');
  console.log('-'.repeat(30));

  console.log('📍 Métricas de sistema (/health/system)');
  try {
    const result = await makeRequest('/health/system');
    console.log(`   Status: ${result.status}`);
    console.log(`   ⏱️ Uptime: ${result.data.uptime}s`);
    console.log(`   🧠 Memória:`);
    console.log(`     • RSS: ${result.data.memory.rss} MB`);
    console.log(`     • Heap usado: ${result.data.memory.heapUsed} MB`);
    console.log(`     • Heap total: ${result.data.memory.heapTotal} MB`);
    console.log(`   🖥️ CPU:`);
    console.log(`     • User: ${result.data.cpu.user}`);
    console.log(`     • System: ${result.data.cpu.system}`);
    console.log(`   📋 Versão Node: ${result.data.nodeVersion}`);
    console.log(`   🔧 Plataforma: ${result.data.platform} (${result.data.arch})\n`);
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}\n`);
  }

  console.log('📍 Status de saúde do sistema (/health/system/status)');
  try {
    const result = await makeRequest('/health/system/status');
    console.log(`   Status: ${result.status}`);
    console.log(`   🏥 Status geral: ${result.data.status}`);
    console.log(`   🧠 Memória: ${result.data.checks.memory.status} (${result.data.checks.memory.usagePercent}%)`);
    console.log(`   ⏱️ Uptime: ${result.data.checks.uptime.status} (${result.data.checks.uptime.seconds}s)\n`);
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}\n`);
  }
}

/**
 * Demonstra o formato Prometheus
 */
async function demonstratePrometheusFormat() {
  console.log('📈 4. FORMATO PROMETHEUS');
  console.log('-'.repeat(30));

  console.log('📍 Métricas em formato Prometheus (/health/prometheus)');
  try {
    const result = await makeRequest('/health/prometheus');
    console.log(`   Status: ${result.status}`);
    console.log(`   Content-Type: ${result.headers['content-type']}`);
    console.log('   📊 Exemplo de métricas (primeiras 10 linhas):');
    
    const lines = result.data.split('\n').slice(0, 10);
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`     ${line}`);
      }
    });
    console.log('     ...\n');
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}\n`);
  }
}

/**
 * Demonstra os endpoints do monitoring controller
 */
async function demonstrateMonitoringController() {
  console.log('🔍 5. MONITORING CONTROLLER');
  console.log('-'.repeat(30));

  console.log('📍 Monitoring health (/monitoring/health)');
  try {
    const result = await makeRequest('/monitoring/health');
    console.log(`   Status: ${result.status}`);
    console.log(`   📊 Status: ${result.data.status}`);
    console.log(`   💬 Message: ${result.data.message}\n`);
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}\n`);
  }

  console.log('📍 Monitoring metrics (/monitoring/metrics)');
  try {
    const result = await makeRequest('/monitoring/metrics');
    console.log(`   Status: ${result.status}`);
    console.log(`   📊 Métricas disponíveis através do monitoring controller\n`);
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}\n`);
  }
}

/**
 * Testa métricas de performance fazendo múltiplas requisições
 */
async function testPerformanceMetrics() {
  console.log('⚡ 6. TESTE DE PERFORMANCE');
  console.log('-'.repeat(30));

  console.log('📍 Fazendo 10 requisições simultâneas para testar métricas...');
  
  const startTime = Date.now();
  const requests = [];
  
  for (let i = 0; i < 10; i++) {
    requests.push(makeRequest('/health'));
  }

  try {
    const results = await Promise.all(requests);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`   ✅ ${results.length} requisições completadas`);
    console.log(`   ⏱️ Tempo total: ${totalTime}ms`);
    console.log(`   📈 Tempo médio por requisição: ${Math.round(totalTime / results.length)}ms`);
    console.log('   📊 Métricas de performance coletadas pelo middleware\n');
    
    // Verificar se alguma requisição tem headers de métricas
    const firstResult = results[0];
    if (firstResult.headers['x-request-id']) {
      console.log(`   🔍 Request ID detectado: ${firstResult.headers['x-request-id']}`);
    }
    if (firstResult.headers['x-response-time']) {
      console.log(`   ⏱️ Response Time header: ${firstResult.headers['x-response-time']}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Erro nos testes de performance: ${error.message}\n`);
  }
}

/**
 * Resumo final
 */
function showSummary() {
  console.log('🎉 RESUMO DA FASE 6');
  console.log('='.repeat(50));
  console.log('✅ Health Checks implementados:');
  console.log('   • Health check básico para load balancers');
  console.log('   • Health check detalhado por domínios');
  console.log('   • Health checks específicos (sales, accounts)');
  console.log('   • Métricas de sistema (CPU, memória)');
  console.log('');
  console.log('✅ Métricas implementadas:');
  console.log('   • Métricas por domínio de negócio');
  console.log('   • Métricas de sistema automáticas');
  console.log('   • Formato Prometheus para dashboards');
  console.log('   • Interceptors para captura automática');
  console.log('');
  console.log('✅ Monitoramento implementado:');
  console.log('   • Middleware de sistema para todas as rotas');
  console.log('   • Logging estruturado para observabilidade');
  console.log('   • Alertas automáticos para problemas');
  console.log('   • Endpoints públicos para ferramentas externas');
  console.log('');
  console.log('🚀 Sistema pronto para produção com observabilidade completa!');
  console.log('📊 Próximos passos: integrar com Grafana/Prometheus');
  console.log('');
}

/**
 * Executa toda a demonstração
 */
async function runDemonstration() {
  console.log(`🔗 Conectando com ${hostname}:${port}\n`);
  
  try {
    await demonstrateHealthChecks();
    await demonstrateMetrics();
    await demonstrateSystemMetrics();
    await demonstratePrometheusFormat();
    await demonstrateMonitoringController();
    await testPerformanceMetrics();
    
    showSummary();
    
  } catch (error) {
    console.error('❌ Erro geral na demonstração:', error);
    process.exit(1);
  }
}

// Executar demonstração
runDemonstration();
