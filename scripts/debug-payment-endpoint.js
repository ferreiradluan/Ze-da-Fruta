#!/usr/bin/env node

/**
 * 🔧 TESTE DEBUG - ENDPOINT PAYMENT
 * 
 * Script para debugar especificamente o problema de autenticação
 * no endpoint /payment/create-checkout-session
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Seu token (copiado do teste anterior)
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiMzMxNTc1Yi1jN2U3LTQzNTktYWFkYS1hY2ZjZjUzOWQwNmYiLCJlbWFpbCI6ImhlbnJpbHVhbjlAZ21haWwuY29tIiwidHlwZSI6InVzZXIiLCJyb2xlcyI6WyJTRUxMRVIiLCJVU0VSIl0sImlhdCI6MTc1MDY0MTgyMywiZXhwIjoxNzUxMjQ2NjIzfQ.3yDlIYuC0KENxgUdCN3P_5OIwqeuxXZFOQMhz4bFZY4';

async function testarTokenValidade() {
  console.log('🔍 Testando validade do token...');
  
  try {
    // Testar em endpoint que sabemos que funciona
    const response = await axios.get(`${BASE_URL}/sales/public/products`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Token é válido - conseguiu acessar /sales/public/products');
    return true;
  } catch (error) {
    console.log('❌ Token inválido:', error.message);
    return false;
  }
}

async function testarEndpointPayment() {
  console.log('\n🔧 Testando endpoint /payment/create-checkout-session...');
  
  const dados = {
    itens: [
      {
        produtoId: 'test-id',
        nome: 'Produto Teste',
        preco: 10.00,
        quantidade: 1
      }
    ],
    enderecoEntrega: 'Rua Teste, 123',
    observacoes: 'Teste debug',
    metodoPagamento: 'STRIPE_CHECKOUT'
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/payment/create-checkout-session`, dados, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000,
      validateStatus: () => true // Aceitar qualquer status para análise
    });
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📝 Resposta:`, JSON.stringify(response.data, null, 2));
    
    if (response.status === 401) {
      console.log('\n🚨 ERRO 401 - PROBLEMA DE AUTENTICAÇÃO');
      console.log('Possíveis causas:');
      console.log('1. Guard JWT não reconhece o token');
      console.log('2. Token expirado');
      console.log('3. Configuração incorreta do guard');
    }
    
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Dados: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

async function verificarTokenDecodificado() {
  console.log('\n🔍 Verificando conteúdo do token...');
  
  try {
    const payload = JSON.parse(Buffer.from(TOKEN.split('.')[1], 'base64').toString());
    console.log('📋 Payload do token:', JSON.stringify(payload, null, 2));
    
    const agora = Math.floor(Date.now() / 1000);
    console.log(`⏰ Timestamp atual: ${agora}`);
    console.log(`⏰ Token expira em: ${payload.exp}`);
    console.log(`⏰ Token ${payload.exp > agora ? 'VÁLIDO' : 'EXPIRADO'}`);
    
  } catch (error) {
    console.log('❌ Erro ao decodificar token:', error.message);
  }
}

async function testarOutrosEndpointsComAuth() {
  console.log('\n🧪 Testando outros endpoints que precisam de auth...');
  
  const endpoints = [
    { method: 'GET', url: '/profile/me', name: 'Profile' },
    { method: 'GET', url: '/account/profile/me', name: 'Account Profile' },
    { method: 'GET', url: '/payment/methods', name: 'Payment Methods' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios({
        method: endpoint.method,
        url: `${BASE_URL}${endpoint.url}`,
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000,
        validateStatus: () => true
      });
      
      console.log(`${endpoint.name}: Status ${response.status}`);
    } catch (error) {
      console.log(`${endpoint.name}: Erro - ${error.message}`);
    }
  }
}

async function main() {
  console.log('🔧 DEBUG - ENDPOINT PAYMENT');
  console.log('='.repeat(50));
  
  // 1. Verificar se token está válido
  const tokenValido = await testarTokenValidade();
  
  // 2. Decodificar token
  await verificarTokenDecodificado();
  
  // 3. Testar endpoint problemático
  await testarEndpointPayment();
  
  // 4. Testar outros endpoints para comparação
  await testarOutrosEndpointsComAuth();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Debug finalizado');
}

main().catch(console.error);
