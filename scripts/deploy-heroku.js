#!/usr/bin/env node

/**
 * Script automatizado para deploy no Heroku (versão Node.js)
 * Execute com: node scripts/deploy-heroku.js <nome-do-app>
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function execCommand(command, options = {}) {
  try {
    return execSync(command, { stdio: 'inherit', ...options });
  } catch (error) {
    console.error(`❌ Erro executando: ${command}`);
    throw error;
  }
}

async function main() {
  const appName = process.argv[2];
  
  if (!appName) {
    console.error('❌ Nome da aplicação é obrigatório');
    console.log('📖 Uso: node scripts/deploy-heroku.js <nome-do-app>');
    process.exit(1);
  }
  
  console.log('🚀 Iniciando deploy automatizado para o Heroku...');
  console.log(`📱 App: ${appName}`);
  
  // Verificar Heroku CLI
  try {
    execSync('heroku --version', { stdio: 'pipe' });
    console.log('✅ Heroku CLI encontrado');
  } catch (error) {
    console.error('❌ Heroku CLI não encontrado. Instale em: https://devcenter.heroku.com/articles/heroku-cli');
    process.exit(1);
  }
  
  // Verificar login
  try {
    execSync('heroku auth:whoami', { stdio: 'pipe' });
    console.log('✅ Usuário logado no Heroku');
  } catch (error) {
    console.log('🔑 Fazendo login no Heroku...');
    execCommand('heroku login');
  }
  
  // Criar aplicação se não existir
  console.log('📦 Verificando/criando aplicação...');
  try {
    execSync(`heroku apps:info ${appName}`, { stdio: 'pipe' });
    console.log('✅ Aplicação existente encontrada');
  } catch (error) {
    console.log('🆕 Criando nova aplicação...');
    execCommand(`heroku create ${appName}`);
  }
  
  // Configurar variáveis de ambiente
  console.log('⚙️  Configurando variáveis de ambiente...');
  
  const envVars = {
    'NODE_ENV': 'production',
    'DATABASE_PATH': './ze_da_fruta.sqlite',
    'JWT_EXPIRES_IN': '1d',
    'RATE_LIMIT_PUBLIC_TTL': '60',
    'RATE_LIMIT_PUBLIC_LIMIT': '50',
    'RATE_LIMIT_AUTH_TTL': '60',
    'RATE_LIMIT_AUTH_LIMIT': '200',
    'HELMET_ENABLED': 'true'
  };
  
  for (const [key, value] of Object.entries(envVars)) {
    execCommand(`heroku config:set "${key}=${value}" --app ${appName}`);
  }
  
  // Gerar JWT_SECRET se não existir
  try {
    const jwtSecret = execSync(`heroku config:get JWT_SECRET --app ${appName}`, { encoding: 'utf8' }).trim();
    if (!jwtSecret) {
      throw new Error('JWT_SECRET vazio');
    }
    console.log('✅ JWT_SECRET já configurado');
  } catch (error) {
    console.log('🔐 Gerando JWT_SECRET...');
    const crypto = require('crypto');
    const jwtSecret = crypto.randomBytes(32).toString('base64');
    execCommand(`heroku config:set "JWT_SECRET=${jwtSecret}" --app ${appName}`);
  }
  
  // Configurar URLs
  const frontendUrl = await question(`🌐 Digite a URL do frontend (ou pressione Enter para usar https://${appName}-frontend.herokuapp.com): `);
  const finalFrontendUrl = frontendUrl.trim() || `https://${appName}-frontend.herokuapp.com`;
  
  execCommand(`heroku config:set "CORS_ORIGIN=${finalFrontendUrl}" --app ${appName}`);
  execCommand(`heroku config:set "FRONTEND_URL=${finalFrontendUrl}" --app ${appName}`);
  
  // Google OAuth (opcional)
  const configureGoogle = await question('🔍 Configurar Google OAuth? (y/N): ');
  if (configureGoogle.toLowerCase() === 'y') {
    const googleClientId = await question('Google Client ID: ');
    const googleClientSecret = await question('Google Client Secret: ');
    
    if (googleClientId.trim() && googleClientSecret.trim()) {
      execCommand(`heroku config:set "GOOGLE_CLIENT_ID=${googleClientId.trim()}" --app ${appName}`);
      execCommand(`heroku config:set "GOOGLE_CLIENT_SECRET=${googleClientSecret.trim()}" --app ${appName}`);
      execCommand(`heroku config:set "GOOGLE_CALLBACK_URL=https://${appName}.herokuapp.com/auth/google/callback" --app ${appName}`);
    }
  }
  
  // Stripe (opcional)
  const configureStripe = await question('💳 Configurar Stripe? (y/N): ');
  if (configureStripe.toLowerCase() === 'y') {
    const stripeSecret = await question('Stripe Secret Key: ');
    const stripeWebhook = await question('Stripe Webhook Secret (opcional): ');
    
    if (stripeSecret.trim()) {
      execCommand(`heroku config:set "STRIPE_SECRET_KEY=${stripeSecret.trim()}" --app ${appName}`);
      execCommand(`heroku config:set "STRIPE_SUCCESS_URL=${finalFrontendUrl}/success" --app ${appName}`);
      execCommand(`heroku config:set "STRIPE_CANCEL_URL=${finalFrontendUrl}/cancel" --app ${appName}`);
      
      if (stripeWebhook.trim()) {
        execCommand(`heroku config:set "STRIPE_WEBHOOK_SECRET=${stripeWebhook.trim()}" --app ${appName}`);
      }
    }
  }
  
  rl.close();
  
  // Configurar remote do Git
  console.log('🔗 Configurando remote do Git...');
  execCommand(`heroku git:remote --app ${appName}`);
  
  // Fazer deploy
  console.log('🚀 Fazendo deploy...');
  const commitMessage = `Deploy para produção no Heroku - ${new Date().toISOString()}`;
  
  try {
    execCommand('git add .');
    execCommand(`git commit -m "${commitMessage}"`);
  } catch (error) {
    console.log('⚠️  Nenhuma mudança para commit, continuando...');
  }
  
  execCommand('git push heroku main');
  
  // Verificar status
  console.log('📊 Verificando status do deploy...');
  execCommand(`heroku ps --app ${appName}`);
  
  // Executar seed
  console.log('🌱 Executando seed dos dados...');
  execCommand(`heroku run npm run seed:prod --app ${appName}`);
  
  // Sucesso
  console.log('🎉 Deploy concluído!');
  console.log(`🌐 URL da aplicação: https://${appName}.herokuapp.com`);
  console.log(`📚 Documentação Swagger: https://${appName}.herokuapp.com/api`);
  console.log(`📊 Dashboard Heroku: https://dashboard.heroku.com/apps/${appName}`);
  
  console.log('\n📋 Comandos úteis:');
  console.log(`heroku logs --tail --app ${appName}  # Ver logs em tempo real`);
  console.log(`heroku config --app ${appName}        # Ver configurações`);
  console.log(`heroku restart --app ${appName}       # Reiniciar aplicação`);
}

main().catch(console.error);
