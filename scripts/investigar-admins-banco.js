#!/usr/bin/env node

/**
 * 🔍 INVESTIGAR ADMINS NO BANCO
 * 
 * OBJETIVO: Descobrir quais administradores existem no banco SQLite
 * e suas credenciais corretas para login
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

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

async function investigarAdmins() {
  const dbPath = path.resolve('./db/ze_da_fruta.sqlite');
  
  log('🔍 INVESTIGANDO ADMINISTRADORES NO BANCO', 'bold');
  log(`📂 Banco: ${dbPath}`, 'cyan');
  log('', 'reset');
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        log(`❌ Erro ao abrir banco: ${err.message}`, 'red');
        reject(err);
        return;
      }
      
      log('✅ Banco conectado com sucesso!', 'green');
      log('', 'reset');
    });
    
    // Verificar estrutura das tabelas primeiro
    db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
      if (err) {
        log(`❌ Erro ao listar tabelas: ${err.message}`, 'red');
        db.close();
        reject(err);
        return;
      }
      
      log('📋 TABELAS NO BANCO:', 'blue');
      tables.forEach(table => {
        log(`   • ${table.name}`, 'cyan');
      });
      log('', 'reset');
      
      // Procurar por usuários/admins em diferentes tabelas possíveis
      const tabelasUsuarios = ['users', 'user', 'admin', 'admins', 'usuarios', 'administradores', 'accounts'];
      let tabelaEncontrada = null;
      
      // Verificar qual tabela existe
      for (const tabela of tabelasUsuarios) {
        if (tables.some(t => t.name.toLowerCase() === tabela.toLowerCase())) {
          tabelaEncontrada = tabela;
          break;
        }
      }
      
      if (!tabelaEncontrada) {
        // Tentar encontrar tabelas que contenham 'user' no nome
        const tabelasComUser = tables.filter(t => 
          t.name.toLowerCase().includes('user') || 
          t.name.toLowerCase().includes('admin') ||
          t.name.toLowerCase().includes('account')
        );
        
        if (tabelasComUser.length > 0) {
          tabelaEncontrada = tabelasComUser[0].name;
          log(`🔍 Usando tabela encontrada: ${tabelaEncontrada}`, 'yellow');
        } else {
          log('❌ Nenhuma tabela de usuários encontrada!', 'red');
          db.close();
          resolve();
          return;
        }
      }
      
      log(`🔍 Investigando tabela: ${tabelaEncontrada}`, 'yellow');
      log('', 'reset');
      
      // Ver estrutura da tabela
      db.all(`PRAGMA table_info(${tabelaEncontrada})`, (err, colunas) => {
        if (err) {
          log(`❌ Erro ao ler estrutura: ${err.message}`, 'red');
          db.close();
          reject(err);
          return;
        }
        
        log('📊 ESTRUTURA DA TABELA:', 'blue');
        colunas.forEach(col => {
          log(`   • ${col.name} (${col.type})`, 'cyan');
        });
        log('', 'reset');
        
        // Buscar todos os usuários/admins
        db.all(`SELECT * FROM ${tabelaEncontrada} LIMIT 10`, (err, usuarios) => {
          if (err) {
            log(`❌ Erro ao buscar usuários: ${err.message}`, 'red');
            db.close();
            reject(err);
            return;
          }
          
          if (usuarios.length === 0) {
            log('❌ Nenhum usuário encontrado na tabela!', 'red');
            db.close();
            resolve();
            return;
          }
          
          log(`👥 USUÁRIOS ENCONTRADOS (${usuarios.length}):`, 'green');
          log('', 'reset');
          
          usuarios.forEach((usuario, index) => {
            log(`${index + 1}. USUÁRIO:`, 'blue');
            
            // Identificar campos importantes
            const campos = Object.keys(usuario);
            const email = campos.find(c => c.toLowerCase().includes('email')) || 
                         campos.find(c => c.toLowerCase().includes('mail'));
            const senha = campos.find(c => c.toLowerCase().includes('senha') || 
                                         c.toLowerCase().includes('password') || 
                                         c.toLowerCase().includes('pass'));
            const role = campos.find(c => c.toLowerCase().includes('role') || 
                                        c.toLowerCase().includes('tipo') || 
                                        c.toLowerCase().includes('level'));
            const nome = campos.find(c => c.toLowerCase().includes('nome') || 
                                        c.toLowerCase().includes('name'));
            const id = campos.find(c => c.toLowerCase() === 'id');
            
            if (id) log(`   🆔 ID: ${usuario[id]}`, 'cyan');
            if (nome) log(`   👤 Nome: ${usuario[nome]}`, 'cyan');
            if (email) log(`   📧 Email: ${usuario[email]}`, 'cyan');
            if (role) log(`   🔑 Role/Tipo: ${usuario[role]}`, 'cyan');
            if (senha) {
              const senhaValue = usuario[senha];
              if (senhaValue && senhaValue.length > 30) {
                log(`   🔐 Senha: [HASH] ${senhaValue.substring(0, 20)}...`, 'yellow');
              } else {
                log(`   🔐 Senha: ${senhaValue}`, 'yellow');
              }
            }
            
            // Mostrar todos os campos para debug
            log('   📋 Todos os campos:', 'magenta');
            Object.keys(usuario).forEach(key => {
              const value = usuario[key];
              if (key !== senha || !value || value.length <= 30) {
                log(`      ${key}: ${value}`, 'cyan');
              }
            });
            
            log('', 'reset');
          });
          
          // Sugestões de credenciais para teste
          log('💡 CREDENCIAIS PARA TESTE:', 'yellow');
          usuarios.forEach((usuario, index) => {
            const campos = Object.keys(usuario);
            const email = campos.find(c => c.toLowerCase().includes('email')) || 
                         campos.find(c => c.toLowerCase().includes('mail'));
            const role = campos.find(c => c.toLowerCase().includes('role') || 
                                        c.toLowerCase().includes('tipo'));
            
            if (email && usuario[email]) {
              log(`   ${index + 1}. Email: ${usuario[email]}`, 'cyan');
              
              if (role && usuario[role] && usuario[role].toLowerCase().includes('admin')) {
                log(`      ⭐ ADMINISTRADOR!`, 'green');
              }
              
              log(`      Senha sugerida: admin123 ou 123456 ou senha123`, 'cyan');
              log('', 'reset');
            }
          });
          
          db.close();
          resolve();
        });
      });
    });
  });
}

// Executar
if (require.main === module) {
  investigarAdmins().catch(console.error);
}

module.exports = { investigarAdmins };
