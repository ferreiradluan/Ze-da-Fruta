#!/usr/bin/env node

/**
 * 🔍 CONSULTAR PRODUTOS EM PRODUÇÃO - ZÉ DA FRUTA
 * 
 * ✅ Executa consultas SQL diretas no banco SQLite de produção
 * ✅ Retorna todos os produtos disponíveis no sistema
 * ✅ Mostra estabelecimentos, categorias e produtos com detalhes
 * 
 * USO: node scripts/consultar-produtos-producao.js
 */

const { execSync } = require('child_process');
const axios = require('axios');

// ===== CONFIGURAÇÕES =====
const HEROKU_APP = 'meu-ze-da-fruta-backend-8c4976f28553';
const BASE_URL = `https://${HEROKU_APP}.herokuapp.com`;

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  log('='.repeat(60), 'cyan');
  log(` ${title}`, 'bold');
  log('='.repeat(60), 'cyan');
  console.log('');
}

// ===== VERIFICAÇÕES INICIAIS =====
function verificarHerokuCLI() {
  try {
    execSync('heroku --version', { stdio: 'pipe' });
    log('✅ Heroku CLI instalado', 'green');
    return true;
  } catch (error) {
    log('❌ Heroku CLI não encontrado. Instale com: npm install -g heroku', 'red');
    log('   Ou baixe de: https://devcenter.heroku.com/articles/heroku-cli', 'yellow');
    return false;
  }
}

function verificarApp() {
  try {
    const output = execSync(`heroku apps:info --app ${HEROKU_APP}`, { 
      encoding: 'utf8',
      stdio: 'pipe' 
    });
    log(`✅ App ${HEROKU_APP} encontrado`, 'green');
    return true;
  } catch (error) {
    log(`❌ App ${HEROKU_APP} não encontrado ou sem acesso`, 'red');
    log('   Verifique se você tem acesso ao app ou se o nome está correto', 'yellow');
    return false;
  }
}

// ===== CONSULTAS VIA API =====
async function consultarViaAPI() {
  logSection('CONSULTA VIA API REST');
  
  try {
    // 1. Consultar estabelecimentos
    log('🏪 Consultando estabelecimentos...', 'yellow');
    const estabResponse = await axios.get(`${BASE_URL}/sales/public/establishments`, {
      timeout: 10000
    });
    
    const estabelecimentos = estabResponse.data?.estabelecimentos || estabResponse.data || [];
    log(`✅ Encontrados ${estabelecimentos.length} estabelecimentos`, 'green');
    
    if (estabelecimentos.length > 0) {
      console.log('\n📋 ESTABELECIMENTOS:');
      estabelecimentos.forEach((estab, index) => {
        console.log(`   ${index + 1}. ${estab.nome || estab.id}`);
        console.log(`      ID: ${estab.id}`);
        console.log(`      Status: ${estab.ativo ? 'Ativo' : 'Inativo'}`);
        console.log(`      Aberto: ${estab.estaAberto ? 'Sim' : 'Não'}`);
        if (estab.endereco) console.log(`      Endereço: ${estab.endereco}`);
        console.log('');
      });
    }

    // 2. Consultar produtos
    log('📦 Consultando produtos...', 'yellow');
    const prodResponse = await axios.get(`${BASE_URL}/sales/public/products`, {
      timeout: 10000
    });
    
    const produtos = prodResponse.data?.produtos || prodResponse.data || [];
    log(`✅ Encontrados ${produtos.length} produtos`, 'green');
    
    if (produtos.length > 0) {
      console.log('\n🛒 PRODUTOS DISPONÍVEIS:');
      produtos.forEach((prod, index) => {
        console.log(`   ${index + 1}. ${prod.nome || 'Produto sem nome'}`);
        console.log(`      ID: ${prod.id}`);
        console.log(`      Preço: R$ ${prod.preco || '0.00'}`);
        console.log(`      Unidade: ${prod.unidadeMedida || 'N/A'}`);
        console.log(`      Estoque: ${prod.estoque || 0}`);
        console.log(`      Ativo: ${prod.ativo ? 'Sim' : 'Não'}`);
        console.log(`      Disponível: ${prod.disponivel ? 'Sim' : 'Não'}`);
        if (prod.estabelecimentoId) console.log(`      Estabelecimento: ${prod.estabelecimentoId}`);
        console.log('');
      });
    }

    // 3. Consultar categorias
    log('🏷️ Consultando categorias...', 'yellow');
    try {
      const catResponse = await axios.get(`${BASE_URL}/sales/public/categories`, {
        timeout: 10000
      });
      
      const categorias = catResponse.data?.categorias || catResponse.data || [];
      log(`✅ Encontradas ${categorias.length} categorias`, 'green');
      
      if (categorias.length > 0) {
        console.log('\n🏷️ CATEGORIAS:');
        categorias.forEach((cat, index) => {
          console.log(`   ${index + 1}. ${cat.nome || 'Categoria sem nome'}`);
          console.log(`      ID: ${cat.id}`);
          console.log(`      Descrição: ${cat.descricao || 'N/A'}`);
          console.log(`      Ativo: ${cat.ativo ? 'Sim' : 'Não'}`);
          if (cat.estabelecimentoId) console.log(`      Estabelecimento: ${cat.estabelecimentoId}`);
          console.log('');
        });
      }
    } catch (error) {
      log('⚠️ Endpoint de categorias não disponível ou erro', 'yellow');
    }

    return { estabelecimentos, produtos };

  } catch (error) {
    log(`❌ Erro na consulta via API: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Response: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return null;
  }
}

// ===== CONSULTAS VIA HEROKU CLI (SQLite) =====
function consultarViaCLI() {
  logSection('CONSULTA VIA HEROKU CLI (SQL DIRETO)');
  
  try {
    // Como é SQLite, vamos tentar acessar via heroku run
    log('🔍 Executando consulta SQL direta...', 'yellow');
    
    const sqlCommands = `
-- Verificar estrutura do banco
.tables

-- Contar registros principais
SELECT 'ESTABELECIMENTOS' as tabela, COUNT(*) as total FROM estabelecimento WHERE ativo = 1;
SELECT 'PRODUTOS' as tabela, COUNT(*) as total FROM produto WHERE ativo = 1;
SELECT 'CATEGORIAS' as tabela, COUNT(*) as total FROM categoria WHERE ativo = 1;

-- Listar estabelecimentos
SELECT 
  id,
  nome,
  ativo,
  estaAberto,
  endereco
FROM estabelecimento 
WHERE ativo = 1
LIMIT 10;

-- Listar produtos com detalhes
SELECT 
  p.id,
  p.nome,
  p.preco,
  p.unidadeMedida,
  p.estoque,
  p.ativo,
  p.disponivel,
  p.estabelecimentoId,
  e.nome as estabelecimento_nome
FROM produto p
LEFT JOIN estabelecimento e ON p.estabelecimentoId = e.id
WHERE p.ativo = 1 AND p.disponivel = 1
ORDER BY p.nome
LIMIT 20;

-- Listar categorias
SELECT 
  id,
  nome,
  descricao,
  ativo,
  estabelecimentoId
FROM categoria 
WHERE ativo = 1
LIMIT 10;
`;

    // Executar via heroku run
    const command = `heroku run "sqlite3 ze_da_fruta.sqlite '${sqlCommands}'" --app ${HEROKU_APP}`;
    log(`Executando: ${command}`, 'cyan');
    
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 30000
    });
    
    log('✅ Consulta SQL executada com sucesso:', 'green');
    console.log('\n📊 RESULTADO DA CONSULTA SQL:');
    console.log(output);
    
    return true;
    
  } catch (error) {
    log(`❌ Erro na consulta via CLI: ${error.message}`, 'red');
    log('💡 O banco pode não estar acessível via CLI ou ser PostgreSQL', 'yellow');
    return false;
  }
}

// ===== CONSULTAR ADMIN =====
async function consultarAdmin() {
  logSection('CONSULTA DE DADOS ADMIN');
  
  try {
    log('🔑 Tentando endpoint de login admin...', 'yellow');
    
    // Tentar fazer login admin para obter mais informações
    const loginResponse = await axios.post(`${BASE_URL}/auth/admin/login`, {
      email: 'zedafruta@admin.com',
      senha: 'zedafruta321'
    }, {
      timeout: 10000
    });
    
    if (loginResponse.data.access_token) {
      log('✅ Login admin realizado com sucesso!', 'green');
      
      const token = loginResponse.data.access_token;
      
      // Tentar endpoints administrativos
      try {
        log('📊 Consultando dashboard admin...', 'yellow');
        const dashResponse = await axios.get(`${BASE_URL}/admin/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 10000
        });
        
        console.log('\n📈 DASHBOARD ADMIN:');
        console.log(JSON.stringify(dashResponse.data, null, 2));
        
      } catch (error) {
        log('⚠️ Endpoint de dashboard não disponível', 'yellow');
      }
      
      // Tentar consultar produtos via admin
      try {
        log('📦 Consultando produtos via admin...', 'yellow');
        const adminProdResponse = await axios.get(`${BASE_URL}/admin/products`, {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 10000
        });
        
        console.log('\n🛒 PRODUTOS (VIA ADMIN):');
        console.log(JSON.stringify(adminProdResponse.data, null, 2));
        
      } catch (error) {
        log('⚠️ Endpoint admin de produtos não disponível', 'yellow');
      }
    }
    
  } catch (error) {
    log('⚠️ Login admin falhou ou endpoint não disponível', 'yellow');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'yellow');
    }
  }
}

// ===== FUNÇÃO PRINCIPAL =====
async function main() {
  console.clear();
  log('🔍 CONSULTA DE PRODUTOS EM PRODUÇÃO - ZÉ DA FRUTA', 'bold');
  log('=' * 60, 'cyan');
  log(`🎯 App: ${HEROKU_APP}`, 'yellow');
  log(`🌐 URL: ${BASE_URL}`, 'yellow');
  console.log('');
  
  try {
    // 1. Verificações iniciais
    log('🔧 Verificando pré-requisitos...', 'yellow');
    const herokuOk = verificarHerokuCLI();
    const appOk = verificarApp();
    
    if (!herokuOk || !appOk) {
      log('\n❌ Falha nos pré-requisitos. Usando apenas consulta via API.', 'red');
    }
    
    // 2. Consultar via API (método principal)
    const resultadoAPI = await consultarViaAPI();
    
    // 3. Tentar consulta via CLI (método alternativo)
    if (herokuOk && appOk) {
      const resultadoCLI = consultarViaCLI();
      if (!resultadoCLI) {
        log('💡 Consulta via CLI falhou, mas dados via API estão disponíveis', 'yellow');
      }
    }
    
    // 4. Tentar consulta admin
    await consultarAdmin();
    
    // 5. Resumo final
    logSection('RESUMO FINAL');
    
    if (resultadoAPI) {
      const { estabelecimentos, produtos } = resultadoAPI;
      log(`✅ Sistema funcionando em produção!`, 'green');
      log(`📊 Total de estabelecimentos: ${estabelecimentos.length}`, 'green');
      log(`📦 Total de produtos: ${produtos.length}`, 'green');
      
      if (produtos.length > 0) {
        log('\n🎯 PRODUTOS PRONTOS PARA USO NO FRONTEND:', 'green');
        log(`   • ${BASE_URL}/sales/public/products`, 'cyan');
        log(`   • ${BASE_URL}/sales/public/establishments`, 'cyan');
        log(`   • Dados disponíveis para integração imediata!`, 'green');
      } else {
        log('\n⚠️ BANCO VAZIO - Execute seed para popular:', 'yellow');
        log('   node scripts/seed-heroku-production-final.js', 'cyan');
      }
    } else {
      log(`❌ Sistema não está respondendo adequadamente`, 'red');
      log('💡 Verifique se o app está online:', 'yellow');
      log(`   heroku logs --tail --app ${HEROKU_APP}`, 'cyan');
    }
    
  } catch (error) {
    log(`❌ Erro fatal: ${error.message}`, 'red');
    process.exit(1);
  }
}

// ===== EXECUÇÃO =====
if (require.main === module) {
  main();
}

module.exports = {
  main,
  consultarViaAPI,
  consultarViaCLI,
  consultarAdmin
};
