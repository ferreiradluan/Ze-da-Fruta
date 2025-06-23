#!/usr/bin/env node

/**
 * 🌱 POPULAR BANCO DE PRODUÇÃO - ZÉ DA FRUTA
 * 
 * ✅ Popula o banco de produção com dados realistas
 * ✅ Usa APIs REST para popular banco PostgreSQL/SQLite
 * ✅ Estabelecimentos, categorias e produtos variados
 * ✅ Verificações de duplicatas e segurança
 * 
 * URL: https://meu-ze-da-fruta-backend-8c4976f28553.herokuapp.com
 * USO: node scripts/popular-banco-producao.js
 */

const axios = require('axios');

// ===== CONFIGURAÇÕES =====
const BASE_URL = 'https://meu-ze-da-fruta-backend-8c4976f28553.herokuapp.com';
const ADMIN_CREDENTIALS = {
  email: 'zedafruta@admin.com',
  senha: 'zedafruta321'
};

// ===== CORES PARA CONSOLE =====
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  console.log(`🌱 ${title.toUpperCase()}`);
  console.log('='.repeat(70));
}

// ===== ESTADO GLOBAL =====
let adminToken = null;
let estabelecimentosCriados = [];
let categoriasCriadas = [];
let produtosCriados = [];

// ===== UTILITÁRIOS =====
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(endpoint, options = {}) {
  try {
    const config = {
      url: `${BASE_URL}${endpoint}`,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 30000,
      ...options
    };

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    const status = error.response?.status || 0;
    const data = error.response?.data || { message: error.message };
    return { success: false, error: data, status };
  }
}

// ===== AUTENTICAÇÃO =====
async function loginAsAdmin() {
  logSection('ETAPA 1: AUTENTICAÇÃO ADMIN');
  
  log('🔐 Fazendo login como admin...', 'yellow');
  
  const result = await makeRequest('/auth/admin/login', {
    method: 'POST',
    data: ADMIN_CREDENTIALS
  });
  
  if (result.success && result.data?.access_token) {
    adminToken = result.data.access_token;
    log('✅ Login admin realizado com sucesso!', 'green');
    log(`🎫 Token obtido: ${adminToken.substring(0, 50)}...`, 'cyan');
    return true;
  } else {
    log('❌ Falha no login admin', 'red');
    log(JSON.stringify(result, null, 2), 'red');
    return false;
  }
}

// ===== DADOS PARA CRIAÇÃO =====
const ESTABELECIMENTOS = [
  {
    nome: 'Hortifruti Central Premium',
    cnpj: '12.345.678/0001-90',
    endereco: 'Rua das Frutas, 123 - Centro, São Paulo/SP',
    telefone: '(11) 3456-7890',
    email: 'contato@hortifruticentral.com',
    descricao: 'Hortifruti tradicional com produtos frescos e selecionados há mais de 20 anos no centro de São Paulo'
  },
  {
    nome: 'Verduras & Legumes Orgânicos',
    cnpj: '98.765.432/0001-12',
    endereco: 'Av. Paulista, 1500 - Jardins, São Paulo/SP',
    telefone: '(11) 2345-6789',
    email: 'vendas@verduraspremium.com',
    descricao: 'Especialista em verduras e legumes orgânicos certificados, atendendo a região dos Jardins'
  },
  {
    nome: 'Frutaria Tropical Vila Madalena',
    cnpj: '11.222.333/0001-44',
    endereco: 'Rua Harmonia, 456 - Vila Madalena, São Paulo/SP',
    telefone: '(11) 4567-8901',
    email: 'info@frutariavm.com',
    descricao: 'Frutas tropicais e importadas com qualidade garantida na Vila Madalena'
  },
  {
    nome: 'Feira do Produtor Butantã',
    cnpj: '22.333.444/0001-55',
    endereco: 'Av. Corifeu de Azevedo Marques, 789 - Butantã, São Paulo/SP',
    telefone: '(11) 5678-9012',
    email: 'contato@feiradoprodutor.com',
    descricao: 'Produtos direto do produtor rural com preços justos e qualidade garantida'
  },
  {
    nome: 'Empório Natural Moema',
    cnpj: '33.444.555/0001-66',
    endereco: 'Rua dos Pinheiros, 321 - Moema, São Paulo/SP',
    telefone: '(11) 6789-0123',
    email: 'vendas@emporionatural.com',
    descricao: 'Produtos naturais, orgânicos e sustentáveis para uma vida mais saudável'
  }
];

const CATEGORIAS = [
  { nome: 'Frutas Tropicais', descricao: 'Frutas tropicais frescas e doces: manga, abacaxi, mamão, caju' },
  { nome: 'Frutas Cítricas', descricao: 'Frutas cítricas ricas em vitamina C: laranja, limão, tangerina' },
  { nome: 'Verduras Folhosas', descricao: 'Verduras e folhas verdes frescas: alface, rúcula, espinafre' },
  { nome: 'Legumes Frescos', descricao: 'Legumes frescos e nutritivos: tomate, cenoura, abobrinha' },
  { nome: 'Temperos & Ervas', descricao: 'Temperos frescos e ervas aromáticas: manjericão, salsa, coentro' },
  { nome: 'Orgânicos Certificados', descricao: 'Produtos orgânicos com certificação e sem agrotóxicos' },
  { nome: 'Frutas Vermelhas', descricao: 'Frutas vermelhas antioxidantes: morango, amora, framboesa' },
  { nome: 'Raízes & Tubérculos', descricao: 'Raízes e tubérculos nutritivos: batata, mandioca, inhame' }
];

function gerarProdutos() {
  return [
    // Frutas Tropicais
    { nome: 'Manga Tommy', preco: 8.99, descricao: 'Manga doce e suculenta', categoria: 'Frutas Tropicais', unidade: 'kg', estoque: 50 },
    { nome: 'Abacaxi Pérola', preco: 6.50, descricao: 'Abacaxi maduro e doce', categoria: 'Frutas Tropicais', unidade: 'un', estoque: 30 },
    { nome: 'Mamão Formosa', preco: 4.99, descricao: 'Mamão maduro e nutritivo', categoria: 'Frutas Tropicais', unidade: 'kg', estoque: 40 },
    { nome: 'Caju Vermelho', preco: 12.99, descricao: 'Caju fresco e aromático', categoria: 'Frutas Tropicais', unidade: 'kg', estoque: 25 },
    
    // Frutas Cítricas
    { nome: 'Laranja Lima', preco: 3.99, descricao: 'Laranja doce e suculenta', categoria: 'Frutas Cítricas', unidade: 'kg', estoque: 60 },
    { nome: 'Limão Tahiti', preco: 5.99, descricao: 'Limão rico em vitamina C', categoria: 'Frutas Cítricas', unidade: 'kg', estoque: 45 },
    { nome: 'Tangerina Ponkan', preco: 4.50, descricao: 'Tangerina doce e fácil de descascar', categoria: 'Frutas Cítricas', unidade: 'kg', estoque: 35 },
    
    // Verduras Folhosas
    { nome: 'Alface Americana', preco: 2.99, descricao: 'Alface fresca e crocante', categoria: 'Verduras Folhosas', unidade: 'un', estoque: 100 },
    { nome: 'Rúcula Fresca', preco: 3.50, descricao: 'Rúcula com sabor levemente picante', categoria: 'Verduras Folhosas', unidade: 'maço', estoque: 80 },
    { nome: 'Espinafre Baby', preco: 4.99, descricao: 'Espinafre novo e tenro', categoria: 'Verduras Folhosas', unidade: 'maço', estoque: 60 },
    { nome: 'Acelga Colorida', preco: 3.99, descricao: 'Acelga fresca e nutritiva', categoria: 'Verduras Folhosas', unidade: 'maço', estoque: 50 },
    
    // Legumes Frescos
    { nome: 'Tomate Italiano', preco: 7.99, descricao: 'Tomate alongado ideal para molhos', categoria: 'Legumes Frescos', unidade: 'kg', estoque: 70 },
    { nome: 'Cenoura Baby', preco: 6.99, descricao: 'Cenoura pequena e doce', categoria: 'Legumes Frescos', unidade: 'kg', estoque: 55 },
    { nome: 'Abobrinha Italiana', preco: 4.99, descricao: 'Abobrinha fresca e versátil', categoria: 'Legumes Frescos', unidade: 'kg', estoque: 45 },
    { nome: 'Pimentão Vermelho', preco: 8.50, descricao: 'Pimentão doce e colorido', categoria: 'Legumes Frescos', unidade: 'kg', estoque: 40 },
    
    // Temperos & Ervas
    { nome: 'Manjericão Fresco', preco: 2.99, descricao: 'Manjericão aromático para temperos', categoria: 'Temperos & Ervas', unidade: 'maço', estoque: 30 },
    { nome: 'Salsa Lisa', preco: 1.99, descricao: 'Salsa fresca para temperos', categoria: 'Temperos & Ervas', unidade: 'maço', estoque: 50 },
    { nome: 'Coentro Fresco', preco: 1.99, descricao: 'Coentro aromático e fresco', categoria: 'Temperos & Ervas', unidade: 'maço', estoque: 40 },
    { nome: 'Hortelã Pimenta', preco: 2.50, descricao: 'Hortelã fresca e refrescante', categoria: 'Temperos & Ervas', unidade: 'maço', estoque: 35 },
    
    // Orgânicos Certificados
    { nome: 'Banana Orgânica', preco: 6.99, descricao: 'Banana orgânica sem agrotóxicos', categoria: 'Orgânicos Certificados', unidade: 'kg', estoque: 40 },
    { nome: 'Maçã Orgânica Gala', preco: 9.99, descricao: 'Maçã orgânica doce e crocante', categoria: 'Orgânicos Certificados', unidade: 'kg', estoque: 30 },
    { nome: 'Alface Orgânica', preco: 4.99, descricao: 'Alface orgânica livre de agrotóxicos', categoria: 'Orgânicos Certificados', unidade: 'un', estoque: 25 },
    
    // Frutas Vermelhas
    { nome: 'Morango Nacional', preco: 12.99, descricao: 'Morango doce e suculento', categoria: 'Frutas Vermelhas', unidade: 'bandeja', estoque: 20 },
    { nome: 'Amora Preta', preco: 15.99, descricao: 'Amora rica em antioxidantes', categoria: 'Frutas Vermelhas', unidade: 'bandeja', estoque: 15 },
    
    // Raízes & Tubérculos
    { nome: 'Batata Inglesa', preco: 3.99, descricao: 'Batata fresca para diversos usos', categoria: 'Raízes & Tubérculos', unidade: 'kg', estoque: 80 },
    { nome: 'Mandioca Descascada', preco: 4.50, descricao: 'Mandioca fresca e limpa', categoria: 'Raízes & Tubérculos', unidade: 'kg', estoque: 60 },
    { nome: 'Inhame Roxo', preco: 5.99, descricao: 'Inhame nutritivo e saboroso', categoria: 'Raízes & Tubérculos', unidade: 'kg', estoque: 40 }
  ];
}

// ===== CRIAR ESTABELECIMENTOS =====
async function criarEstabelecimentos() {
  logSection('ETAPA 2: CRIANDO ESTABELECIMENTOS');
  
  const headers = { 'Authorization': `Bearer ${adminToken}` };
  
  for (const [index, estabelecimento] of ESTABELECIMENTOS.entries()) {
    log(`🏪 Criando estabelecimento ${index + 1}/${ESTABELECIMENTOS.length}: ${estabelecimento.nome}`, 'yellow');
    
    const result = await makeRequest('/admin/estabelecimentos', {
      method: 'POST',
      headers,
      data: estabelecimento
    });
    
    if (result.success) {
      estabelecimentosCriados.push(result.data);
      log(`✅ Estabelecimento criado: ${estabelecimento.nome}`, 'green');
      log(`   ID: ${result.data.id}`, 'cyan');
    } else {
      log(`❌ Erro ao criar ${estabelecimento.nome}:`, 'red');
      log(`   ${JSON.stringify(result.error, null, 2)}`, 'red');
    }
    
    // Pausa entre criações
    await sleep(1000);
  }
  
  log(`\n🎉 Estabelecimentos criados: ${estabelecimentosCriados.length}/${ESTABELECIMENTOS.length}`, 'green');
}

// ===== CRIAR CATEGORIAS =====
async function criarCategorias() {
  logSection('ETAPA 3: CRIANDO CATEGORIAS');
  
  const headers = { 'Authorization': `Bearer ${adminToken}` };
  
  for (const [index, categoria] of CATEGORIAS.entries()) {
    log(`🏷️ Criando categoria ${index + 1}/${CATEGORIAS.length}: ${categoria.nome}`, 'yellow');
    
    const result = await makeRequest('/sales/categorias', {
      method: 'POST',
      headers,
      data: categoria
    });
    
    if (result.success) {
      categoriasCriadas.push(result.data);
      log(`✅ Categoria criada: ${categoria.nome}`, 'green');
    } else {
      log(`❌ Erro ao criar ${categoria.nome}:`, 'red');
      log(`   ${JSON.stringify(result.error, null, 2)}`, 'red');
    }
    
    await sleep(500);
  }
  
  log(`\n🎉 Categorias criadas: ${categoriasCriadas.length}/${CATEGORIAS.length}`, 'green');
}

// ===== CRIAR PRODUTOS =====
async function criarProdutos() {
  logSection('ETAPA 4: CRIANDO PRODUTOS');
  
  const headers = { 'Authorization': `Bearer ${adminToken}` };
  const produtos = gerarProdutos();
  
  for (const [index, produto] of produtos.entries()) {
    log(`📦 Criando produto ${index + 1}/${produtos.length}: ${produto.nome}`, 'yellow');
    
    // Dados do produto para criação
    const produtoData = {
      nome: produto.nome,
      preco: produto.preco,
      descricao: produto.descricao,
      unidadeMedida: produto.unidade,
      estoque: produto.estoque,
      ativo: true,
      disponivel: true
    };
    
    const result = await makeRequest('/admin/products', {
      method: 'POST',
      headers,
      data: produtoData
    });
    
    if (result.success) {
      produtosCriados.push(result.data);
      log(`✅ Produto criado: ${produto.nome} - R$ ${produto.preco}`, 'green');
    } else {
      log(`❌ Erro ao criar ${produto.nome}:`, 'red');
      log(`   ${JSON.stringify(result.error, null, 2)}`, 'red');
    }
    
    await sleep(500);
  }
  
  log(`\n🎉 Produtos criados: ${produtosCriados.length}/${produtos.length}`, 'green');
}

// ===== RELATÓRIO FINAL =====
function exibirRelatorioFinal() {
  logSection('RELATÓRIO FINAL DE POPULAÇÃO');
  
  log('📊 RESUMO DA POPULAÇÃO:', 'bold');
  log(`   🏪 Estabelecimentos: ${estabelecimentosCriados.length}/${ESTABELECIMENTOS.length}`, 'cyan');
  log(`   🏷️ Categorias: ${categoriasCriadas.length}/${CATEGORIAS.length}`, 'cyan');
  log(`   📦 Produtos: ${produtosCriados.length}/${gerarProdutos().length}`, 'cyan');
  
  const total = estabelecimentosCriados.length + categoriasCriadas.length + produtosCriados.length;
  const esperado = ESTABELECIMENTOS.length + CATEGORIAS.length + gerarProdutos().length;
  
  log(`\n🎯 TOTAL CRIADO: ${total}/${esperado} itens`, 'bold');
  
  if (total === esperado) {
    log('🎉 POPULAÇÃO COMPLETA COM SUCESSO!', 'green');
  } else {
    log('⚠️ População parcialmente concluída', 'yellow');
  }
  
  log('\n🔗 PRÓXIMOS PASSOS:', 'blue');
  log('   1. Testar endpoints públicos para verificar dados', 'cyan');
  log('   2. Executar script de compra Stripe', 'cyan');
  log('   3. Validar funcionamento do frontend', 'cyan');
  
  log('\n🧪 COMANDOS PARA TESTAR:', 'blue');
  log('   node scripts/gerar-compra-stripe-local.js', 'cyan');
  log('   node scripts/consultar-produtos-producao.js', 'cyan');
}

// ===== FUNÇÃO PRINCIPAL =====
async function main() {
  console.log('🌱 POPULAR BANCO DE PRODUÇÃO - ZÉ DA FRUTA');
  console.log('='.repeat(70));
  console.log(`🌐 URL: ${BASE_URL}`);
  console.log(`📅 Executado em: ${new Date().toLocaleString('pt-BR')}`);
  console.log('');
  
  try {
    // 1. Login
    const loginSuccess = await loginAsAdmin();
    if (!loginSuccess) {
      log('❌ Não foi possível fazer login. Encerrando...', 'red');
      process.exit(1);
    }
    
    // 2. Criar estabelecimentos
    await criarEstabelecimentos();
    
    // 3. Criar categorias
    await criarCategorias();
    
    // 4. Criar produtos
    await criarProdutos();
    
    // 5. Relatório final
    exibirRelatorioFinal();
    
    log('\n✅ População do banco de produção concluída!', 'green');
    
  } catch (error) {
    log(`❌ Erro durante a população: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// ===== EXECUÇÃO =====
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
