const https = require('https');

console.log('🔍 DEBUG: Testando endpoint de produtos em produção...');

const options = {
  hostname: 'ze-da-fruta-backend-6c5a4b6b3c2d.herokuapp.com',
  path: '/sales/public/products',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  console.log('📊 Status:', res.statusCode);
  console.log('📏 Content-Length:', res.headers['content-length']);
  
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('📦 Response type:', typeof parsed);
      console.log('📋 Is array:', Array.isArray(parsed));
      console.log('🔢 Array length:', Array.isArray(parsed) ? parsed.length : 'N/A');
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log('✅ Primeiro produto:', JSON.stringify(parsed[0], null, 2));
      } else {
        console.log('❌ Array vazio ou estrutura inválida');
        console.log('🔍 Response completa:', JSON.stringify(parsed, null, 2));
      }
    } catch (e) {
      console.log('❌ Erro ao parsear JSON:', e.message);
      console.log('📄 Raw response:', data);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Erro na requisição:', err.message);
});

req.end();
