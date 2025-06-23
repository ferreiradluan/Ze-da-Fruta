#!/usr/bin/env node

/**
 * 🌱 SEED PRODUÇÃO - ZÉ DA FRUTA HEROKU
 * 
 * ✅ Seed robusta para ambiente de produção no Heroku
 * ✅ Usa APIs REST para popular banco PostgreSQL
 * ✅ Dados realistas para demonstração
 * ✅ Verificações de segurança e duplicatas
 * 
 * URL: https://meu-ze-da-fruta-backend-8c4976f28553.herokuapp.com
 * USO: node scripts/seed-producao.js
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
let seedResults = {
  estabelecimentos: [],
  categorias: [],
  produtos: [],
  erros: []
};

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
      validateStatus: () => true // Não rejeitar por status HTTP
    };

    if (options.data) {
      config.data = options.data;
    }

    const response = await axios(config);
    
    return {
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response.data,
      error: response.status >= 400 ? response.data : null
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
}

// ===== VERIFICAÇÕES INICIAIS =====
async function verificarServidor() {
  logSection('ETAPA 1: VERIFICAÇÃO DO SERVIDOR');
  
  log('🔍 Verificando conectividade com Heroku...', 'yellow');
  
  const result = await makeRequest('/');
  
  if (result.success || result.status === 404) {
    log('✅ Servidor Heroku online e acessível', 'green');
    return true;
  } else {
    log(`❌ Servidor Heroku inacessível (Status: ${result.status})`, 'red');
    log(`   Erro: ${result.error || 'Sem resposta'}`, 'red');
    return false;
  }
}

// ===== AUTENTICAÇÃO =====
async function loginAsAdmin() {
  logSection('ETAPA 2: AUTENTICAÇÃO ADMIN');
  
  log('🔐 Fazendo login como administrador...', 'yellow');
  
  const result = await makeRequest('/auth/admin/login', {
    method: 'POST',
    data: ADMIN_CREDENTIALS
  });
  if (result.success && result.data?.access_token) {
    adminToken = result.data.access_token;
    log('✅ Login admin realizado com sucesso', 'green');
    log(`   Token obtido: ${adminToken.substring(0, 20)}...`, 'cyan');
    return true;
  } else {
    log('❌ Falha no login admin', 'red');
    log(`   Status: ${result.status}`, 'red');
    log(`   Erro: ${JSON.stringify(result.error)}`, 'red');
    return false;
  }
}

// ===== VERIFICAR DADOS EXISTENTES =====
async function verificarDadosExistentes() {
  logSection('ETAPA 3: VERIFICAÇÃO DE DADOS EXISTENTES');
  
  const checks = [
    { endpoint: '/admin/estabelecimentos', name: 'estabelecimentos' },
    { endpoint: '/sales/categorias', name: 'categorias' },
    { endpoint: '/sales/produtos', name: 'produtos' }
  ];

  let hasData = false;

  for (const check of checks) {
    const result = await makeRequest(check.endpoint, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      log(`⚠️  ${check.name}: ${result.data.length} registros existentes`, 'yellow');
      hasData = true;
    } else {
      log(`✅ ${check.name}: sem dados (pronto para seed)`, 'green');
    }
  }

  if (hasData) {
    log('', 'reset');
    log('⚠️  AVISO: Dados existentes encontrados!', 'yellow');
    log('   Este seed pode criar duplicatas.', 'yellow');
    log('   Recomenda-se limpar o banco antes.', 'yellow');
  }

  return !hasData;
}

// ===== DADOS PARA PRODUÇÃO =====
const ESTABELECIMENTOS = [
  {
    nome: 'Hortifruti Central SP',
    cnpj: '12.345.678/0001-90',
    endereco: 'Rua das Frutas, 123 - Centro, São Paulo/SP',
    telefone: '(11) 3456-7890',
    email: 'contato@hortifruticentral.com',
    descricao: 'Hortifruti tradicional com produtos frescos e selecionados há mais de 20 anos no centro de São Paulo'
  },
  {
    nome: 'Verduras Premium Jardins',
    cnpj: '98.765.432/0001-12',
    endereco: 'Av. Paulista, 1500 - Jardins, São Paulo/SP',
    telefone: '(11) 2345-6789',
    email: 'vendas@verduraspremium.com',
    descricao: 'Especialista em verduras e legumes orgânicos certificados, atendendo a região dos Jardins'
  },
  {
    nome: 'Frutaria Vila Madalena',
    cnpj: '11.222.333/0001-44',
    endereco: 'Rua Harmonia, 456 - Vila Madalena, São Paulo/SP',
    telefone: '(11) 4567-8901',
    email: 'info@frutariavm.com',
    descricao: 'Frutas tropicais e importadas com qualidade garantida na Vila Madalena'
  }
];

const CATEGORIAS = [
  { nome: 'Frutas Frescas', descricao: 'Frutas frescas, doces e selecionadas diariamente' },
  { nome: 'Verduras & Folhas', descricao: 'Verduras e folhosas frescas colhidas no dia' },
  { nome: 'Legumes Frescos', descricao: 'Legumes frescos, crocantes e nutritivos' },
  { nome: 'Temperos & Ervas', descricao: 'Temperos frescos e ervas aromáticas' },
  { nome: 'Orgânicos Certificados', descricao: 'Produtos orgânicos com certificação' },
  { nome: 'Frutas Tropicais', descricao: 'Frutas tropicais e exóticas premium' }
];

// ===== CRIAR ESTABELECIMENTOS =====
async function criarEstabelecimentos() {
  logSection('ETAPA 4: CRIANDO ESTABELECIMENTOS');
  
  for (const [index, estab] of ESTABELECIMENTOS.entries()) {
    log(`📍 Criando estabelecimento ${index + 1}/3: ${estab.nome}`, 'yellow');
    
    const result = await makeRequest('/admin/estabelecimentos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      data: estab
    });

    if (result.success) {
      log(`✅ ${estab.nome} criado com sucesso`, 'green');
      seedResults.estabelecimentos.push(result.data);
    } else {
      log(`❌ Erro ao criar ${estab.nome}`, 'red');
      log(`   Status: ${result.status}`, 'red');
      seedResults.erros.push(`Estabelecimento ${estab.nome}: ${result.error}`);
    }

    await sleep(1000); // Evitar rate limiting
  }
}

// ===== CRIAR CATEGORIAS =====
async function criarCategorias() {
  logSection('ETAPA 5: CRIANDO CATEGORIAS');
  
  for (const [index, cat] of CATEGORIAS.entries()) {
    log(`📂 Criando categoria ${index + 1}/${CATEGORIAS.length}: ${cat.nome}`, 'yellow');
    
    const result = await makeRequest('/admin/categorias', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      data: cat
    });

    if (result.success) {
      log(`✅ ${cat.nome} criada com sucesso`, 'green');
      seedResults.categorias.push(result.data);
    } else {
      log(`❌ Erro ao criar categoria ${cat.nome}`, 'red');
      log(`   Status: ${result.status}`, 'red');
      seedResults.erros.push(`Categoria ${cat.nome}: ${result.error}`);
    }

    await sleep(500);
  }
}

// ===== PRODUTOS PARA CRIAÇÃO =====
function gerarProdutos() {
  if (seedResults.estabelecimentos.length === 0 || seedResults.categorias.length === 0) {
    log('❌ Sem estabelecimentos ou categorias para criar produtos', 'red');
    return [];
  }

  const produtos = [
    {
      nome: 'Maçã Gala Premium',
      descricao: 'Maçã Gala doce e crocante, selecionada especialmente',
      preco: 8.90,
      estoque: 100,
      unidadeMedida: 'kg',
      imagemUrl: '/images/produtos/maca-gala.jpg'
    },
    {
      nome: 'Banana Nanica Extra',
      descricao: 'Banana nanica madura no ponto certo, rica em potássio',
      preco: 5.50,
      estoque: 80,
      unidadeMedida: 'kg',
      imagemUrl: '/images/produtos/banana-nanica.jpg'
    },
    {
      nome: 'Alface Americana Orgânica',
      descricao: 'Alface americana orgânica, crocante e fresca',
      preco: 4.20,
      estoque: 50,
      unidadeMedida: 'unidade',
      imagemUrl: '/images/produtos/alface-americana.jpg'
    },
    {
      nome: 'Tomate Italiano Premium',
      descricao: 'Tomate italiano vermelho, suculento e saboroso',
      preco: 9.80,
      estoque: 60,
      unidadeMedida: 'kg',
      imagemUrl: '/images/produtos/tomate-italiano.jpg'
    },
    {
      nome: 'Cenoura Baby Orgânica',
      descricao: 'Cenoura baby orgânica, doce e nutritiva',
      preco: 6.50,
      estoque: 70,
      unidadeMedida: 'kg',
      imagemUrl: '/images/produtos/cenoura-baby.jpg'
    },
    {
      nome: 'Manga Palmer',
      descricao: 'Manga palmer doce e suculenta, fruta tropical premium',
      preco: 12.90,
      estoque: 40,
      unidadeMedida: 'kg',
      imagemUrl: '/images/produtos/manga-palmer.jpg'
    }
  ];

  // Distribuir produtos entre estabelecimentos e categorias
  return produtos.map((prod, index) => ({
    ...prod,
    estabelecimentoId: seedResults.estabelecimentos[index % seedResults.estabelecimentos.length].id,
    categoriaIds: [seedResults.categorias[index % seedResults.categorias.length].id]
  }));
}

// ===== CRIAR PRODUTOS =====
async function criarProdutos() {
  logSection('ETAPA 6: CRIANDO PRODUTOS');
  
  const produtos = gerarProdutos();
  
  if (produtos.length === 0) {
    log('❌ Nenhum produto para criar', 'red');
    return;
  }
  
  for (const [index, prod] of produtos.entries()) {
    log(`📦 Criando produto ${index + 1}/${produtos.length}: ${prod.nome}`, 'yellow');
    
    const result = await makeRequest('/admin/produtos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      data: prod
    });

    if (result.success) {
      log(`✅ ${prod.nome} criado - R$ ${prod.preco}`, 'green');
      seedResults.produtos.push(result.data);
    } else {
      log(`❌ Erro ao criar produto ${prod.nome}`, 'red');
      log(`   Status: ${result.status}`, 'red');
      seedResults.erros.push(`Produto ${prod.nome}: ${result.error}`);
    }

    await sleep(800);
  }
}

// ===== RELATÓRIO FINAL =====
function exibirRelatorioFinal() {
  logSection('RELATÓRIO FINAL - SEED PRODUÇÃO');
  
  log(`📊 Estabelecimentos criados: ${seedResults.estabelecimentos.length}`, 'cyan');
  log(`📊 Categorias criadas: ${seedResults.categorias.length}`, 'cyan');
  log(`📊 Produtos criados: ${seedResults.produtos.length}`, 'cyan');
  log(`📊 Erros encontrados: ${seedResults.erros.length}`, seedResults.erros.length > 0 ? 'red' : 'green');

  if (seedResults.erros.length > 0) {
    log('', 'reset');
    log('❌ ERROS ENCONTRADOS:', 'red');
    seedResults.erros.forEach(erro => log(`   • ${erro}`, 'red'));
  }

  log('', 'reset');
  log('🎉 SEED DE PRODUÇÃO CONCLUÍDO!', 'bold');
  log('', 'reset');
  log('🔗 URLs para teste:', 'yellow');
  log(`   • API: ${BASE_URL}`, 'cyan');
  log(`   • Admin: ${ADMIN_CREDENTIALS.email}`, 'cyan');
  log(`   • Senha: ${ADMIN_CREDENTIALS.senha}`, 'cyan');
}

// ===== FUNÇÃO PRINCIPAL =====
async function main() {
  try {
    logSection('SEED PRODUÇÃO - ZÉ DA FRUTA HEROKU');
    log('🚀 Iniciando seed para ambiente de produção...', 'bold');
    
    // Verificações e preparação
    const servidorOk = await verificarServidor();
    if (!servidorOk) {
      throw new Error('Servidor Heroku inacessível');
    }
    
    const loginOk = await loginAsAdmin();
    if (!loginOk) {
      throw new Error('Falha na autenticação admin');
    }
    
    await verificarDadosExistentes();
    
    // Criação dos dados
    await criarEstabelecimentos();
    await criarCategorias();
    await criarProdutos();
    
    // Relatório final
    exibirRelatorioFinal();
    
  } catch (error) {
    log('', 'reset');
    log(`❌ ERRO FATAL: ${error.message}`, 'red');
    log('', 'reset');
    log('💡 Verifique:', 'yellow');
    log('   1. Conexão com internet', 'yellow');
    log('   2. URL da aplicação Heroku', 'yellow');
    log('   3. Credenciais do admin', 'yellow');
    log('   4. Se a aplicação está online', 'yellow');
    
    process.exit(1);
  }
}

// ===== EXECUÇÃO =====
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
