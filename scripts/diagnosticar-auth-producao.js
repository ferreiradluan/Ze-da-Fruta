#!/usr/bin/env node

/**
 * 🔧 DIAGNÓSTICO E CORREÇÃO - URL /auth/user em Produção
 * 
 * Este script diagnostica e corrige problemas comuns com a URL de login 
 * do Google OAuth em produção para o sistema Zé da Fruta.
 */

const axios = require('axios');
const readline = require('readline');

// Configurações
const PROD_URL = process.env.PROD_URL || 'https://sua-url-producao.com';
const LOCAL_URL = 'http://localhost:3000';

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

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`🔧 ${title}`, 'bold');
  console.log('='.repeat(60));
}

async function testarEndpoint(url, endpoint) {
  try {
    log(`Testando: ${url}${endpoint}`, 'cyan');
    
    const response = await axios.get(`${url}${endpoint}`, {
      timeout: 10000,
      maxRedirects: 0, // Não seguir redirects para OAuth
      validateStatus: function (status) {
        // Aceitar 302 (redirect) como sucesso para OAuth
        return status >= 200 && status < 400;
      }
    });
    
    if (response.status === 302) {
      log(`✅ Endpoint funcionando - Redirecionando para: ${response.headers.location}`, 'green');
      return { status: 'OK', redirect: response.headers.location };
    } else {
      log(`✅ Endpoint respondendo - Status: ${response.status}`, 'green');
      return { status: 'OK', statusCode: response.status };
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log(`❌ Servidor não está rodando`, 'red');
      return { status: 'OFFLINE', error: 'Servidor offline' };
    } else if (error.response?.status === 404) {
      log(`❌ Endpoint não encontrado (404)`, 'red');
      return { status: 'NOT_FOUND', error: 'Endpoint não existe' };
    } else if (error.response?.status === 500) {
      log(`❌ Erro interno do servidor (500)`, 'red');
      return { status: 'SERVER_ERROR', error: 'Erro interno' };
    } else {
      log(`❌ Erro: ${error.message}`, 'red');
      return { status: 'ERROR', error: error.message };
    }
  }
}

async function diagnosticarProducao() {
  logSection('DIAGNÓSTICO DO AMBIENTE DE PRODUÇÃO');
  
  const endpointsParaTestar = [
    '/auth/user',
    '/auth/user/google',
    '/auth/vendedor',
    '/auth/vendedor/google',
    '/auth/entregador',
    '/auth/entregador/google',
    '/auth/google/callback',
    '/health'
  ];
  
  const resultados = {};
  
  for (const endpoint of endpointsParaTestar) {
    const resultado = await testarEndpoint(PROD_URL, endpoint);
    resultados[endpoint] = resultado;
    
    // Aguardar um pouco entre requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return resultados;
}

async function diagnosticarLocal() {
  logSection('DIAGNÓSTICO DO AMBIENTE LOCAL');
  
  const endpointsParaTestar = [
    '/auth/user',
    '/auth/user/google', 
    '/auth/google/callback'
  ];
  
  const resultados = {};
  
  for (const endpoint of endpointsParaTestar) {
    const resultado = await testarEndpoint(LOCAL_URL, endpoint);
    resultados[endpoint] = resultado;
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  return resultados;
}

async function verificarConfiguracaoOAuth() {
  logSection('VERIFICAÇÃO DE CONFIGURAÇÃO OAUTH');
  
  log('🔍 Verificando configurações necessárias...', 'blue');
  
  const configsNecessarias = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET', 
    'GOOGLE_CALLBACK_URL',
    'JWT_SECRET'
  ];
  
  const configuracoes = {};
  
  for (const config of configsNecessarias) {
    if (process.env[config]) {
      configuracoes[config] = process.env[config].substring(0, 10) + '...';
      log(`✅ ${config}: Configurado`, 'green');
    } else {
      configuracoes[config] = null;
      log(`❌ ${config}: NÃO CONFIGURADO`, 'red');
    }
  }
  
  return configuracoes;
}

function gerarSolucoes(resultadosProducao, resultadosLocal, configuracoes) {
  logSection('SOLUÇÕES RECOMENDADAS');
  
  const problemas = [];
  const solucoes = [];
  
  // Verificar se o endpoint principal existe
  if (resultadosProducao['/auth/user']?.status === 'NOT_FOUND') {
    problemas.push('Endpoint /auth/user não encontrado em produção');
    solucoes.push({
      problema: 'Endpoint /auth/user não encontrado',
      solucao: `
🔧 SOLUÇÃO 1: Verificar Build e Deploy
   1. Confirmar que o AuthController está sendo compilado
   2. Verificar se o módulo AccountManagementModule está sendo importado
   3. Executar novo build: npm run build
   4. Fazer novo deploy
   
💡 Comandos:
   npm run build
   # Verificar se não há erros de TypeScript
   # Fazer deploy novamente
      `
    });
  }
  
  // Verificar configurações OAuth
  if (!configuracoes.GOOGLE_CLIENT_ID || !configuracoes.GOOGLE_CLIENT_SECRET) {
    problemas.push('Configurações OAuth incompletas');
    solucoes.push({
      problema: 'Configurações OAuth não encontradas',
      solucao: `
🔧 SOLUÇÃO 2: Configurar Variáveis de Ambiente
   1. Verificar se as variáveis estão definidas no servidor de produção
   2. Configurar no painel do provedor (Heroku, Vercel, etc.)
   
💡 Variáveis necessárias:
   GOOGLE_CLIENT_ID=seu_client_id
   GOOGLE_CLIENT_SECRET=seu_client_secret
   GOOGLE_CALLBACK_URL=https://sua-url-producao.com/auth/google/callback
   JWT_SECRET=sua_chave_secreta
      `
    });
  }
  
  // Verificar URL de callback
  if (resultadosProducao['/auth/google/callback']?.status === 'NOT_FOUND') {
    problemas.push('Callback URL não encontrada');
    solucoes.push({
      problema: 'URL de callback OAuth não funciona',
      solucao: `
🔧 SOLUÇÃO 3: Configurar URL de Callback
   1. Verificar no Google Cloud Console se a URL está correta
   2. A URL deve ser: https://sua-url-producao.com/auth/google/callback
   3. Não esquecer de adicionar a URL no console do Google
   
💡 Passos no Google Cloud Console:
   1. Acessar APIs & Services > Credentials
   2. Editar OAuth 2.0 Client ID
   3. Adicionar em "Authorized redirect URIs":
      https://sua-url-producao.com/auth/google/callback
      `
    });
  }
  
  // Verificar se servidor está offline
  if (resultadosProducao['/health']?.status === 'OFFLINE') {
    problemas.push('Servidor de produção offline');
    solucoes.push({
      problema: 'Servidor não está respondendo',
      solucao: `
🔧 SOLUÇÃO 4: Verificar Status do Servidor
   1. Verificar logs do servidor de produção
   2. Verificar se o processo está rodando
   3. Reiniciar se necessário
   
💡 Comandos comuns:
   # Heroku
   heroku ps:restart -a seu-app
   heroku logs --tail -a seu-app
   
   # PM2
   pm2 restart all
   pm2 logs
      `
    });
  }
  
  return { problemas, solucoes };
}

async function executarDiagnostico() {
  log('🚀 DIAGNÓSTICO DE PROBLEMAS COM /auth/user EM PRODUÇÃO', 'bold');
  log('', 'reset');
  
  try {
    // Verificar configurações
    const configuracoes = await verificarConfiguracaoOAuth();
    
    // Testar local primeiro
    const resultadosLocal = await diagnosticarLocal();
    
    // Testar produção
    const resultadosProducao = await diagnosticarProducao();
    
    // Gerar soluções
    const { problemas, solucoes } = gerarSolucoes(resultadosProducao, resultadosLocal, configuracoes);
    
    // Exibir resultados
    logSection('RESUMO DO DIAGNÓSTICO');
    
    if (problemas.length === 0) {
      log('🎉 Nenhum problema detectado! Tudo parece estar funcionando.', 'green');
    } else {
      log(`📋 Foram encontrados ${problemas.length} problema(s):`, 'yellow');
      problemas.forEach((problema, index) => {
        log(`   ${index + 1}. ${problema}`, 'red');
      });
    }
    
    // Exibir soluções
    if (solucoes.length > 0) {
      logSection('SOLUÇÕES DETALHADAS');
      solucoes.forEach((item, index) => {
        log(`\n${index + 1}. ${item.problema}:`, 'yellow');
        log(item.solucao, 'cyan');
      });
    }
    
    // Teste manual
    logSection('TESTE MANUAL RECOMENDADO');
    log('Para testar manualmente, tente:', 'blue');
    log(`1. Abrir no navegador: ${PROD_URL}/auth/user`, 'cyan');
    log('2. Verificar se redireciona para o Google', 'cyan');
    log('3. Após login, verificar se retorna um token válido', 'cyan');
    
  } catch (error) {
    log(`❌ Erro durante diagnóstico: ${error.message}`, 'red');
  }
}

// Executar diagnóstico
if (require.main === module) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('🔗 Qual é a URL de produção? (ex: https://meuapp.herokuapp.com): ', (url) => {
    if (url && url.startsWith('http')) {
      process.env.PROD_URL = url.replace(/\/$/, ''); // Remove trailing slash
      log(`✅ URL de produção configurada: ${process.env.PROD_URL}`, 'green');
    } else {
      log('⚠️  URL inválida, usando URL padrão', 'yellow');
    }
    
    rl.close();
    executarDiagnostico();
  });
}

module.exports = {
  diagnosticarProducao,
  diagnosticarLocal,
  verificarConfiguracaoOAuth,
  testarEndpoint
};
