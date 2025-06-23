#!/usr/bin/env node

/**
 * 🌱 SEED PRINCIPAL - ZÉ DA FRUTA
 * 
 * ✅ Seed robusta e consolidada para desenvolvimento local
 * ✅ Popula banco SQLite com dados realistas
 * ✅ Estrutura completa: usuarios, estabelecimentos, categorias, produtos
 * ✅ Inclui admin padrão para testes
 * 
 * USO: npm run seed:principal
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ===== CONFIGURAÇÕES =====
const DB_PATH = path.resolve(__dirname, '../db/ze_da_fruta.sqlite');

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

// ===== UTILITÁRIOS PARA SQL =====
async function executeSql(db, query, params = []) {
  return new Promise((resolve, reject) => {
    if (params.length > 0) {
      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    } else {
      db.run(query, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    }
  });
}

async function querySql(db, query, params = []) {
  return new Promise((resolve, reject) => {
    if (params.length > 0) {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    } else {
      db.all(query, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    }
  });
}

// ===== DADOS PARA SEED =====
const ADMIN_USER = {
  id: 'admin-001',
  nome: 'Administrador Sistema',
  email: 'zedafruta@admin.com',
  senha: 'zedafruta321',
  status: 'ATIVO'
};

const ESTABELECIMENTOS = [
  {
    id: 'estab-001',
    nome: 'Hortifruti Central',
    endereco: 'Rua das Frutas, 123 - Centro, São Paulo/SP',
    telefone: '(11) 3456-7890',
    email: 'contato@hortifruticentral.com',
    cnpj: '12.345.678/0001-90',
    descricao: 'Hortifruti com produtos frescos e selecionados há mais de 20 anos',
    status: 'ATIVO',
    estaAberto: true
  },
  {
    id: 'estab-002',
    nome: 'Verduras & Legumes Premium',
    endereco: 'Av. dos Vegetais, 456 - Jardins, São Paulo/SP',
    telefone: '(11) 2345-6789',
    email: 'vendas@verduraslegumes.com',
    cnpj: '98.765.432/0001-12',
    descricao: 'Especialista em verduras e legumes orgânicos certificados',
    status: 'ATIVO',
    estaAberto: true
  },
  {
    id: 'estab-003',
    nome: 'Frutaria do Bairro',
    endereco: 'Rua da Feira, 789 - Vila Madalena, São Paulo/SP',
    telefone: '(11) 4567-8901',
    email: 'info@frutariadobairro.com',
    cnpj: '11.222.333/0001-44',
    descricao: 'Frutas tropicais e importadas com qualidade garantida',
    status: 'ATIVO',
    estaAberto: true
  }
];

const CATEGORIAS = [
  { id: 'cat-001', nome: 'Frutas', descricao: 'Frutas frescas, doces e selecionadas' },
  { id: 'cat-002', nome: 'Verduras', descricao: 'Verduras e folhosas frescas' },
  { id: 'cat-003', nome: 'Legumes', descricao: 'Legumes frescos e crocantes' },
  { id: 'cat-004', nome: 'Temperos', descricao: 'Temperos e ervas aromáticas' },
  { id: 'cat-005', nome: 'Orgânicos', descricao: 'Produtos orgânicos certificados' }
];

const PRODUTOS = [
  {
    id: 'prod-001',
    nome: 'Maçã Gala',
    descricao: 'Maçã Gala doce e crocante, ideal para lanches e sobremesas',
    preco: 8.90,
    estoque: 100,
    unidadeMedida: 'kg',
    categoria: 'cat-001',
    estabelecimento: 'estab-001',
    imagemUrl: '/images/produtos/maca-gala.jpg',
    status: 'ATIVO'
  },
  {
    id: 'prod-002',
    nome: 'Banana Nanica',
    descricao: 'Banana nanica madura, rica em potássio e vitaminas',
    preco: 5.50,
    estoque: 80,
    unidadeMedida: 'kg',
    categoria: 'cat-001',
    estabelecimento: 'estab-001',
    imagemUrl: '/images/produtos/banana-nanica.jpg',
    status: 'ATIVO'
  },
  {
    id: 'prod-003',
    nome: 'Alface Americana',
    descricao: 'Alface americana crocante, perfeita para saladas',
    preco: 3.20,
    estoque: 50,
    unidadeMedida: 'unidade',
    categoria: 'cat-002',
    estabelecimento: 'estab-002',
    imagemUrl: '/images/produtos/alface-americana.jpg',
    status: 'ATIVO'
  },
  {
    id: 'prod-004',
    nome: 'Tomate Salada',
    descricao: 'Tomate fresco para saladas e molhos caseiros',
    preco: 7.80,
    estoque: 60,
    unidadeMedida: 'kg',
    categoria: 'cat-003',
    estabelecimento: 'estab-002',
    imagemUrl: '/images/produtos/tomate-salada.jpg',
    status: 'ATIVO'
  },
  {
    id: 'prod-005',
    nome: 'Cenoura Baby',
    descricao: 'Cenoura baby doce e nutritiva, ideal para crianças',
    preco: 4.50,
    estoque: 70,
    unidadeMedida: 'kg',
    categoria: 'cat-003',
    estabelecimento: 'estab-003',
    imagemUrl: '/images/produtos/cenoura-baby.jpg',
    status: 'ATIVO'
  },
  {
    id: 'prod-006',
    nome: 'Manga Palmer',
    descricao: 'Manga palmer doce e suculenta, fruta tropical',
    preco: 12.90,
    estoque: 40,
    unidadeMedida: 'kg',
    categoria: 'cat-001',
    estabelecimento: 'estab-003',
    imagemUrl: '/images/produtos/manga-palmer.jpg',
    status: 'ATIVO'
  },
  {
    id: 'prod-007',
    nome: 'Rúcula Orgânica',
    descricao: 'Rúcula orgânica certificada, sabor marcante',
    preco: 6.50,
    estoque: 30,
    unidadeMedida: 'maço',
    categoria: 'cat-005',
    estabelecimento: 'estab-002',
    imagemUrl: '/images/produtos/rucula-organica.jpg',
    status: 'ATIVO'
  },
  {
    id: 'prod-008',
    nome: 'Manjericão',
    descricao: 'Manjericão fresco para temperos e molhos',
    preco: 2.80,
    estoque: 25,
    unidadeMedida: 'maço',
    categoria: 'cat-004',
    estabelecimento: 'estab-001',
    imagemUrl: '/images/produtos/manjericao.jpg',
    status: 'ATIVO'
  }
];

// ===== FUNÇÃO PRINCIPAL =====
async function seedPrincipal() {
  logSection('SEED PRINCIPAL - ZÉ DA FRUTA');
  log(`📂 Banco: ${DB_PATH}`, 'cyan');
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, async (err) => {
      if (err) {
        log(`❌ Erro ao conectar no banco: ${err.message}`, 'red');
        reject(err);
        return;
      }
      
      log('✅ Conectado ao banco de dados SQLite', 'green');
      
      try {
        // 1. Limpar dados existentes
        logSection('LIMPEZA DE DADOS');
        const tablesToClean = [
          'produto_categoria', 'itens_pedido', 'pedidos', 'produto', 
          'categoria', 'estabelecimento', 'usuarios', 'admins'
        ];
        
        for (const table of tablesToClean) {
          try {
            await executeSql(db, `DELETE FROM ${table}`);
            log(`✅ Tabela ${table} limpa`, 'yellow');
          } catch (error) {
            log(`⚠️  Tabela ${table} não existe ou já está vazia`, 'yellow');
          }
        }
        
        // 2. Criar Admin
        logSection('CRIANDO ADMINISTRADOR');
        const senhaHash = await bcrypt.hash(ADMIN_USER.senha, 12);
        const now = new Date().toISOString();
        
        await executeSql(db, `
          INSERT INTO admins (id, nome, email, senhaHash, status, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [ADMIN_USER.id, ADMIN_USER.nome, ADMIN_USER.email, senhaHash, ADMIN_USER.status, now, now]);
        
        log(`✅ Admin criado: ${ADMIN_USER.email} (senha: ${ADMIN_USER.senha})`, 'green');
        
        // 3. Criar Estabelecimentos
        logSection('CRIANDO ESTABELECIMENTOS');
        for (const estab of ESTABELECIMENTOS) {
          await executeSql(db, `
            INSERT INTO estabelecimento (
              id, nome, endereco, telefone, email, cnpj, descricao, 
              status, estaAberto, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            estab.id, estab.nome, estab.endereco, estab.telefone, estab.email,
            estab.cnpj, estab.descricao, estab.status, estab.estaAberto ? 1 : 0,
            now, now
          ]);
          
          log(`✅ Estabelecimento: ${estab.nome}`, 'green');
        }
        
        // 4. Criar Categorias
        logSection('CRIANDO CATEGORIAS');
        for (const cat of CATEGORIAS) {
          await executeSql(db, `
            INSERT INTO categoria (id, nome, descricao, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?)
          `, [cat.id, cat.nome, cat.descricao, now, now]);
          
          log(`✅ Categoria: ${cat.nome}`, 'green');
        }
        
        // 5. Criar Produtos
        logSection('CRIANDO PRODUTOS');
        for (const prod of PRODUTOS) {
          await executeSql(db, `
            INSERT INTO produto (
              id, nome, descricao, preco, estoque, unidadeMedida, 
              imagemUrl, status, estabelecimentoId, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            prod.id, prod.nome, prod.descricao, prod.preco, prod.estoque,
            prod.unidadeMedida, prod.imagemUrl, prod.status, prod.estabelecimento,
            now, now
          ]);
          
          // Associar produto à categoria
          await executeSql(db, `
            INSERT INTO produto_categoria (produtoId, categoriaId) 
            VALUES (?, ?)
          `, [prod.id, prod.categoria]);
          
          log(`✅ Produto: ${prod.nome} (R$ ${prod.preco})`, 'green');
        }
        
        // 6. Verificar dados criados
        logSection('VERIFICAÇÃO FINAL');
        const admins = await querySql(db, 'SELECT COUNT(*) as count FROM admins');
        const estabelecimentos = await querySql(db, 'SELECT COUNT(*) as count FROM estabelecimento');
        const categorias = await querySql(db, 'SELECT COUNT(*) as count FROM categoria');
        const produtos = await querySql(db, 'SELECT COUNT(*) as count FROM produto');
        
        log(`📊 Admins criados: ${admins[0].count}`, 'cyan');
        log(`📊 Estabelecimentos criados: ${estabelecimentos[0].count}`, 'cyan');
        log(`📊 Categorias criadas: ${categorias[0].count}`, 'cyan');
        log(`📊 Produtos criados: ${produtos[0].count}`, 'cyan');
        
        logSection('SUCESSO');
        log('🎉 Seed principal executado com sucesso!', 'bold');
        log('', 'reset');
        log('📝 CREDENCIAIS PARA TESTE:', 'yellow');
        log(`   Admin: ${ADMIN_USER.email}`, 'cyan');
        log(`   Senha: ${ADMIN_USER.senha}`, 'cyan');
        log('', 'reset');
        log('🚀 Agora você pode iniciar o servidor com: npm run start:dev', 'green');
        
        db.close();
        resolve();
        
      } catch (error) {
        log(`❌ Erro durante seed: ${error.message}`, 'red');
        db.close();
        reject(error);
      }
    });
  });
}

// ===== EXECUÇÃO =====
if (require.main === module) {
  seedPrincipal()
    .then(() => {
      log('✅ Processo concluído com sucesso!', 'green');
      process.exit(0);
    })
    .catch((error) => {
      log(`❌ Erro fatal: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { seedPrincipal };
