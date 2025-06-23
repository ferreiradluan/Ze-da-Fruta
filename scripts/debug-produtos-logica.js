/**
 * 🐛 DEBUG ESPECÍFICO: Investigar produtos criados no banco
 * 
 * Este script vai testar a lógica do SalesService diretamente
 * para entender por que os produtos não aparecem nos endpoints públicos
 */

const BACKEND_URL = 'https://meu-ze-da-fruta-backend-8c4976f28553.herokuapp.com';

console.log('🐛 DEBUG: Investigando lógica de busca de produtos...\n');

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

async function debugProdutos() {
  console.log('='.repeat(80));
  console.log('🐛 FASE 1: TESTANDO TODAS AS VARIAÇÕES DE ENDPOINT DE PRODUTOS');
  console.log('='.repeat(80));

  // Testar todos os endpoints de produtos possíveis
  const endpointsProdutos = [
    '/sales/public/products',
    '/sales/public/products?categoria=',
    '/sales/public/products?estabelecimento=',
    '/sales/public/products?search=',
    '/products',
    '/catalog/products',
    '/api/products',
    '/api/sales/public/products'
  ];

  for (const endpoint of endpointsProdutos) {
    const resultado = await fazerRequisicao(`${BACKEND_URL}${endpoint}`);
    console.log(`\n🔗 ${endpoint}:`);
    console.log(`   Status: ${resultado.status}`);
    
    if (resultado.status === 200) {
      if (Array.isArray(resultado.data)) {
        console.log(`   ✅ Produtos retornados: ${resultado.data.length}`);
        if (resultado.data.length > 0) {
          console.log(`   📋 Primeiro produto:`, JSON.stringify(resultado.data[0], null, 2));
        }
      } else {
        console.log(`   ❓ Resposta não é array:`, resultado.data);
      }
    } else {
      console.log(`   ❌ Erro:`, resultado.data);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('🐛 FASE 2: VERIFICANDO SE PRODUTOS RETORNAM EM ADMIN (SEM TOKEN)');
  console.log('='.repeat(80));

  // Tentar endpoints admin sem autenticação (veremos as mensagens de erro)
  const resultado = await fazerRequisicao(`${BACKEND_URL}/admin/products`);
  console.log(`\n🔗 /admin/products (sem token):`);
  console.log(`   Status: ${resultado.status}`);
  console.log(`   Resposta:`, resultado.data);

  console.log('\n' + '='.repeat(80));
  console.log('🐛 FASE 3: VERIFICANDO LOGS DE DEBUG NO BACKEND');
  console.log('='.repeat(80));

  // Fazer várias requisições para gerar logs de debug
  console.log('\n📡 Fazendo requisições de debug...');
  
  for (let i = 0; i < 3; i++) {
    const resultado = await fazerRequisicao(`${BACKEND_URL}/sales/public/products`);
    console.log(`   Tentativa ${i + 1}: Status ${resultado.status}, Items: ${resultado.data?.length || 0}`);
    
    // Pequena pausa entre requisições
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(80));
  console.log('🐛 FASE 4: TESTANDO FILTROS ESPECÍFICOS');
  console.log('='.repeat(80));

  // Testar com diferentes filtros
  const filtros = [
    '?categoria=Frutas+Cítricas',
    '?estabelecimento=Empório',
    '?search=laranja',
    '?search=banana',
    '?categoria=&estabelecimento=&search='
  ];

  for (const filtro of filtros) {
    const resultado = await fazerRequisicao(`${BACKEND_URL}/sales/public/products${filtro}`);
    console.log(`\n🔍 Filtro ${filtro}:`);
    console.log(`   Status: ${resultado.status}, Items: ${resultado.data?.length || 0}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('🐛 FASE 5: VERIFICANDO DADOS DE CATEGORIAS E ESTABELECIMENTOS');
  console.log('='.repeat(80));

  // Verificar se categorias e estabelecimentos têm dados
  const categorias = await fazerRequisicao(`${BACKEND_URL}/sales/public/categories`);
  const estabelecimentos = await fazerRequisicao(`${BACKEND_URL}/sales/public/establishments`);

  console.log(`\n📊 Categorias: ${categorias.data?.length || 0} encontradas`);
  if (categorias.data?.length > 0) {
    console.log(`   Primeira categoria:`, {
      id: categorias.data[0].id,
      nome: categorias.data[0].nome,
      ativo: categorias.data[0].ativo
    });
  }

  console.log(`\n🏪 Estabelecimentos: ${estabelecimentos.data?.length || 0} encontrados`);
  if (estabelecimentos.data?.length > 0) {
    console.log(`   Primeiro estabelecimento:`, {
      id: estabelecimentos.data[0].id,
      nome: estabelecimentos.data[0].nome,
      ativo: estabelecimentos.data[0].ativo
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('📋 RESUMO DO DEBUG');
  console.log('='.repeat(80));
  
  console.log(`
🔍 ANÁLISE CONCLUÍDA!

📋 DESCOBERTAS:
- Categorias: ${categorias.data?.length || 0}
- Estabelecimentos: ${estabelecimentos.data?.length || 0}  
- Produtos: 0 (PROBLEMA IDENTIFICADO)

🎯 PRÓXIMOS PASSOS:
1. Verificar se produtos estão sendo criados com ativo=true
2. Verificar se estabelecimentoId está sendo associado corretamente
3. Investigar o JOIN entre produto-estabelecimento na query
4. Adicionar logs de debug no SalesService.buscarProdutosPublico()

💡 POSSÍVEIS CAUSAS:
- Produtos criados com ativo=false
- Produtos sem estabelecimentoId válido
- Problema no JOIN da query TypeORM
- Problema na lógica de filtro do service
  `);
}

// Executar debug
debugProdutos().catch(console.error);
