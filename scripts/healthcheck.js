#!/usr/bin/env node

/**
 * Healthcheck script para verificar se a aplicação está funcionando
 */

const http = require('http');

const port = process.env.PORT || 3000;
const hostname = process.env.HOSTNAME || 'localhost';

const options = {
  hostname: hostname,
  port: port,
  path: '/api',
  method: 'GET',
  timeout: 5000
};

console.log(`🏥 Verificando saúde da aplicação em ${hostname}:${port}`);

const req = http.request(options, (res) => {
  console.log(`✅ Status: ${res.statusCode}`);
  
  if (res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302) {
    console.log('✅ Aplicação está funcionando!');
    process.exit(0);
  } else {
    console.log('❌ Aplicação retornou status não esperado');
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.error('❌ Erro de conexão:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Timeout na verificação');
  req.destroy();
  process.exit(1);
});

req.setTimeout(5000);
req.end();
