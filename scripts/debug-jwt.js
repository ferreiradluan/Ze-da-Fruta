#!/usr/bin/env node

/**
 * 🔧 TESTE JWT VALIDATION - DEBUG ESPECÍFICO
 * 
 * Testa diretamente a validação do JWT sem passar pelo endpoint
 */

const jwt = require('jsonwebtoken');

// Configurações diretas (copiar da .env)
const JWT_SECRET = 'zeDaFrutaSuperSecretKey2025';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiMzMxNTc1Yi1jN2U3LTQzNTktYWFkYS1hY2ZjZjUzOWQwNmYiLCJlbWFpbCI6ImhlbnJpbHVhbjlAZ21haWwuY29tIiwidHlwZSI6InVzZXIiLCJyb2xlcyI6WyJTRUxMRVIiLCJVU0VSIl0sImlhdCI6MTc1MDY0MTgyMywiZXhwIjoxNzUxMjQ2NjIzfQ.3yDlIYuC0KENxgUdCN3P_5OIwqeuxXZFOQMhz4bFZY4';

function testarTokenJWT() {
  console.log('🔧 TESTE DE VALIDAÇÃO JWT');
  console.log('='.repeat(50));
  console.log(`JWT_SECRET: ${JWT_SECRET}`);
  console.log(`Token: ${TOKEN.substring(0, 50)}...`);
  console.log('');

  try {
    // 1. Decodificar sem verificar
    const decoded = jwt.decode(TOKEN);
    console.log('✅ Token decodificado (sem verificação):');
    console.log(JSON.stringify(decoded, null, 2));
    console.log('');

    // 2. Verificar com o secret
    const verified = jwt.verify(TOKEN, JWT_SECRET);
    console.log('✅ Token verificado com JWT_SECRET:');
    console.log(JSON.stringify(verified, null, 2));
    console.log('');

    // 3. Testar se o token expirou
    const agora = Math.floor(Date.now() / 1000);
    const expira = verified.exp;
    console.log(`⏰ Agora: ${agora}`);
    console.log(`⏰ Expira: ${expira}`);
    console.log(`⏰ Status: ${expira > agora ? 'VÁLIDO' : 'EXPIRADO'}`);
    
    return true;
  } catch (error) {
    console.log('❌ ERRO na validação JWT:');
    console.log(`   Tipo: ${error.name}`);
    console.log(`   Mensagem: ${error.message}`);
    
    if (error.name === 'JsonWebTokenError') {
      console.log('   🔍 Provavelmente problema com o secret');
    } else if (error.name === 'TokenExpiredError') {
      console.log('   🔍 Token expirado');
    }
    
    return false;
  }
}

function testarComSecretErrado() {
  console.log('\n🔧 TESTE COM SECRET ERRADO');
  console.log('='.repeat(50));
  
  try {
    const verified = jwt.verify(TOKEN, 'secret-errado');
    console.log('✅ Verificado com secret errado (não deveria acontecer!)');
    return true;
  } catch (error) {
    console.log('❌ ERRO esperado com secret errado:');
    console.log(`   ${error.message}`);
    return false;
  }
}

function gerarNovoToken() {
  console.log('\n🔧 GERANDO NOVO TOKEN');
  console.log('='.repeat(50));
  
  const payload = {
    sub: 'b331575b-c7e7-4359-aada-acfcf539d06f',
    email: 'henriluan9@gmail.com',
    type: 'user',
    roles: ['SELLER', 'USER'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 dias
  };
  
  const novoToken = jwt.sign(payload, JWT_SECRET);
  console.log('✅ Novo token gerado:');
  console.log(novoToken);
  console.log('');
  
  // Verificar o novo token
  try {
    const verified = jwt.verify(novoToken, JWT_SECRET);
    console.log('✅ Novo token verificado com sucesso:');
    console.log(JSON.stringify(verified, null, 2));
    return novoToken;
  } catch (error) {
    console.log('❌ Erro ao verificar novo token:', error.message);
    return null;
  }
}

async function main() {
  console.log('🔧 DEBUG JWT VALIDATION COMPLETO');
  console.log('='.repeat(70));
  
  // 1. Testar token atual
  const tokenValido = testarTokenJWT();
  
  // 2. Testar com secret errado
  testarComSecretErrado();
  
  // 3. Gerar novo token
  const novoToken = gerarNovoToken();
  
  console.log('\n' + '='.repeat(70));
  console.log('📋 RESUMO:');
  console.log(`   Token original válido: ${tokenValido ? 'SIM' : 'NÃO'}`);
  console.log(`   Novo token gerado: ${novoToken ? 'SIM' : 'NÃO'}`);
  
  if (novoToken) {
    console.log('\n💡 TESTE NO POSTMAN/INSOMNIA:');
    console.log('Authorization: Bearer ' + novoToken);
  }
}

main().catch(console.error);
