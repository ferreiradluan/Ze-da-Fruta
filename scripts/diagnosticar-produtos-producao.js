/**
 * 🔍 DIAGNÓSTICO COMPLETO: Investigar estado dos produtos em produção
 * 
 * Este script vai verificar:
 * 1. Se produtos existem no banco
 * 2. Quais são os valores dos campos críticos (ativo, disponivel, estoque)
 * 3. Relação com estabelecimentos e categorias
 * 4. Consistência dos dados
 */

const BACKEND_URL = 'https://meu-ze-da-fruta-backend-8c4976f28553.herokuapp.com';

console.log('🔍 DIAGNÓSTICO: Investigando produtos em produção...\n');

// Função para fazer requisições HTTP
async function fazerRequisicao(url, options = {}) {
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      status: response.status,
      data: data,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    console.error(`❌ Erro na requisição para ${url}:`, error.message);
    return { status: 0, error: error.message };
  }
}

async function diagnosticar() {
  console.log('='.repeat(80));
  console.log('📊 FASE 1: VERIFICANDO ENDPOINTS PÚBLICOS');
  console.log('='.repeat(80));

  // 1. Testar endpoints públicos de produtos
  const endpointsPublicos = [
    '/sales/public/products',
    '/products',
    '/catalog/products',
    '/public/products'
  ];

  for (const endpoint of endpointsPublicos) {
    const resultado = await fazerRequisicao(`${BACKEND_URL}${endpoint}`);
    console.log(`\n🔗 ${endpoint}:`);
    console.log(`   Status: ${resultado.status}`);
    
    if (resultado.status === 200 && Array.isArray(resultado.data)) {
      console.log(`   Produtos retornados: ${resultado.data.length}`);
      if (resultado.data.length > 0) {
        console.log(`   Primeiro produto:`, resultado.data[0]);
      }
    } else {
      console.log(`   Resposta:`, resultado.data);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 FASE 2: VERIFICANDO ENDPOINTS ADMIN (SE TIVER TOKEN)');
  console.log('='.repeat(80));

  // 2. Tentar endpoints admin (se tiver acesso)
  const endpointsAdmin = [
    '/admin/products',
    '/admin/estabelecimentos',
    '/admin/categorias'
  ];

  for (const endpoint of endpointsAdmin) {
    const resultado = await fazerRequisicao(`${BACKEND_URL}${endpoint}`);
    console.log(`\n🔗 ${endpoint}:`);
    console.log(`   Status: ${resultado.status}`);
    
    if (resultado.status === 200 && Array.isArray(resultado.data)) {
      console.log(`   Items retornados: ${resultado.data.length}`);
      if (resultado.data.length > 0) {
        console.log(`   Primeiro item:`, JSON.stringify(resultado.data[0], null, 2));
      }
    } else if (resultado.status === 401) {
      console.log(`   ⚠️  Endpoint protegido - precisa de autenticação`);
    } else {
      console.log(`   Resposta:`, resultado.data);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 FASE 3: VERIFICANDO CATEGORIAS E ESTABELECIMENTOS PÚBLICOS');
  console.log('='.repeat(80));

  // 3. Verificar categorias e estabelecimentos
  const endpointsRelacionados = [
    '/sales/public/categories',
    '/sales/public/establishments',
    '/categories',
    '/establishments'
  ];

  for (const endpoint of endpointsRelacionados) {
    const resultado = await fazerRequisicao(`${BACKEND_URL}${endpoint}`);
    console.log(`\n🔗 ${endpoint}:`);
    console.log(`   Status: ${resultado.status}`);
    
    if (resultado.status === 200 && Array.isArray(resultado.data)) {
      console.log(`   Items retornados: ${resultado.data.length}`);
      if (resultado.data.length > 0) {
        console.log(`   Primeiro item:`, JSON.stringify(resultado.data[0], null, 2));
      }
    } else {
      console.log(`   Resposta:`, resultado.data);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 FASE 4: TESTANDO SAÚDE DO SISTEMA');
  console.log('='.repeat(80));

  // 4. Verificar saúde geral do sistema
  const endpointsSaude = [
    '/health',
    '/',
    '/api',
    '/status'
  ];

  for (const endpoint of endpointsSaude) {
    const resultado = await fazerRequisicao(`${BACKEND_URL}${endpoint}`);
    console.log(`\n🔗 ${endpoint}:`);
    console.log(`   Status: ${resultado.status}`);
    console.log(`   Resposta:`, resultado.data);
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMO DO DIAGNÓSTICO');
  console.log('='.repeat(80));
  
  console.log(`
🔍 DIAGNÓSTICO CONCLUÍDO!

📋 PRÓXIMOS PASSOS:
1. Verificar se produtos estão sendo criados com ativo=true
2. Verificar se estabelecimentos estão ativo=true
3. Verificar joins entre produto-estabelecimento-categoria
4. Testar endpoint com dados de debug
5. Verificar logs do Heroku em tempo real

💡 PARA INVESTIGAR MAIS:
- Acessar logs do Heroku: heroku logs --tail -a ze-da-fruta-backend
- Verificar schema do banco em produção: \\admin\\debug
- Testar criação manual de produto via API admin
  `);
}

// Executar diagnóstico
diagnosticar().catch(console.error);
