#!/usr/bin/env node

/**
 * 🔧 TESTE RÁPIDO - NOVO TOKEN
 * 
 * Testa o endpoint com o novo token gerado
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const NOVO_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiMzMxNTc1Yi1jN2U3LTQzNTktYWFkYS1hY2ZjZjUzOWQwNmYiLCJlbWFpbCI6ImhlbnJpbHVhbjlAZ21haWwuY29tIiwidHlwZSI6InVzZXIiLCJyb2xlcyI6WyJTRUxMRVIiLCJVU0VSIl0sImlhdCI6MTc1MDY0MjQzNCwiZXhwIjoxNzUxMjQ3MjM0fQ.eF16QOYkI_VxiOVzYeqS59xVtRj1LzzbjD7vpcfwL9uk';

async function testarNovoToken() {
  console.log('🧪 TESTE COM NOVO TOKEN GERADO');
  console.log('='.repeat(50));
  
  const dados = {
    itens: [
      {
        produtoId: 'test-id-1',
        nome: 'Produto Teste 1',
        preco: 10.00,
        quantidade: 1
      }
    ],
    enderecoEntrega: 'Rua Teste, 123',
    observacoes: 'Teste com novo token',
    metodoPagamento: 'STRIPE_CHECKOUT'
  };
  
  try {
    console.log('🔄 Testando /payment/create-checkout-session...');
    
    const response = await axios.post(`${BASE_URL}/payment/create-checkout-session`, dados, {
      headers: {
        'Authorization': `Bearer ${NOVO_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000,
      validateStatus: () => true // Aceitar qualquer status
    });
    
    console.log(`📊 Status: ${response.status}`);
    console.log('📝 Resposta:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 || response.status === 201) {
      console.log('🎉 SUCESSO! Endpoint funcionando!');
      
      if (response.data.sessionId && response.data.checkoutUrl) {
        console.log('');
        console.log('💳 LINK STRIPE GERADO:');
        console.log(response.data.checkoutUrl);
      }
    } else if (response.status === 401) {
      console.log('❌ Ainda com erro 401 - problema no JWT Strategy');
    } else if (response.status === 500) {
      console.log('❌ Erro interno - possivelmente configuração Stripe');
    }
    
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Dados:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function testarEndpointPublico() {
  console.log('\n🧪 TESTE ENDPOINT PÚBLICO (comparação)');
  console.log('='.repeat(50));
  
  try {
    const response = await axios.get(`${BASE_URL}/sales/public/products`, {
      timeout: 5000
    });
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📦 Produtos encontrados: ${response.data.length || 'N/A'}`);
    console.log('✅ Endpoint público funcionando normalmente');
    
  } catch (error) {
    console.log('❌ Erro no endpoint público:', error.message);
  }
}

async function main() {
  await testarEndpointPublico();
  await testarNovoToken();
}

main().catch(console.error);
