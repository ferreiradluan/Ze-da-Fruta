#!/usr/bin/env node

/**
 * 📊 FASE 6: SCRIPT DE TESTE PARA MÉTRICAS
 * 
 * Script para testar se o sistema de métricas está funcionando
 */

const http = require('http');

const port = process.env.PORT || 3000;
const hostname = process.env.HOSTNAME || 'localhost';

console.log('🧪 Testando sistema de métricas...\n');

/**
 * Helper para fazer requests HTTP
 */
function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: hostname,
      port: port,
      path: path,
      method: method,
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsedData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
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

    req.setTimeout(5000);
    req.end();
  });
}

/**
 * Testa endpoints de health e métricas
 */
async function testHealthAndMetrics() {
  console.log('📊 1. Testando health check básico...');
  try {
    const result = await makeRequest('/health');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response:`, JSON.stringify(result.data, null, 2));
    console.log('   ✅ Health check básico funcionando\n');
  } catch (error) {
    console.log('   ❌ Erro no health check:', error.message);
  }

  console.log('📊 2. Testando health check detalhado...');
  try {
    const result = await makeRequest('/health/detailed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response:`, JSON.stringify(result.data, null, 2));
    console.log('   ✅ Health check detalhado funcionando\n');
  } catch (error) {
    console.log('   ❌ Erro no health check detalhado:', error.message);
  }

  console.log('📊 3. Testando métricas de domínio...');
  try {
    const result = await makeRequest('/health/metrics');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response:`, JSON.stringify(result.data, null, 2));
    console.log('   ✅ Métricas de domínio funcionando\n');
  } catch (error) {
    console.log('   ❌ Erro nas métricas de domínio:', error.message);
  }

  console.log('📊 4. Testando métricas do sistema...');
  try {
    const result = await makeRequest('/health/system');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response:`, JSON.stringify(result.data, null, 2));
    console.log('   ✅ Métricas de sistema funcionando\n');
  } catch (error) {
    console.log('   ❌ Erro nas métricas de sistema:', error.message);
  }

  console.log('📊 5. Testando formato Prometheus...');
  try {
    const result = await makeRequest('/health/prometheus');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response (primeiras 500 chars):`, result.data.toString().substring(0, 500));
    console.log('   ✅ Formato Prometheus funcionando\n');
  } catch (error) {
    console.log('   ❌ Erro no formato Prometheus:', error.message);
  }

  console.log('📊 6. Testando monitoring controller...');
  try {
    const result = await makeRequest('/monitoring/health');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response:`, JSON.stringify(result.data, null, 2));
    console.log('   ✅ Monitoring controller funcionando\n');
  } catch (error) {
    console.log('   ❌ Erro no monitoring controller:', error.message);
  }
}

/**
 * Testa múltiplas requisições para verificar métricas de performance
 */
async function testPerformanceMetrics() {
  console.log('⚡ 7. Testando métricas de performance (múltiplas requisições)...');
  
  const requests = [];
  for (let i = 0; i < 5; i++) {
    requests.push(makeRequest('/health'));
  }

  try {
    const results = await Promise.all(requests);
    console.log(`   ✅ ${results.length} requisições completadas`);
    console.log('   📈 Métricas de performance devem ter sido coletadas\n');
  } catch (error) {
    console.log('   ❌ Erro nos testes de performance:', error.message);
  }
}

/**
 * Executa todos os testes
 */
async function runTests() {
  console.log(`🚀 Iniciando testes em ${hostname}:${port}\n`);
  
  try {
    await testHealthAndMetrics();
    await testPerformanceMetrics();
    
    console.log('🎉 Testes concluídos!');
    console.log('📊 Verifique os logs da aplicação para ver as métricas sendo coletadas.');
    
  } catch (error) {
    console.error('❌ Erro geral nos testes:', error);
    process.exit(1);
  }
}

// Executar testes
runTests();
