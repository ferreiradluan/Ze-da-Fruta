#!/usr/bin/env node

/**
 * 🔧 SCRIPT PARA VERIFICAR E CRIAR ADMIN NO BANCO
 * 
 * Este script:
 * 1. Verifica se existe admin no banco
 * 2. Se não existir, cria um admin padrão
 * 3. Mostra informações do admin criado
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Caminho para o banco de dados
const DB_PATH = path.join(__dirname, '..', 'db', 'ze_da_fruta.sqlite');

// Credenciais do admin padrão
const ADMIN_DATA = {
  email: 'admin@zedafruta.com',
  senha: 'Zedafruta@2025',
  nome: 'Administrador Ze da Fruta'
};

class AdminSetup {
  constructor() {
    this.db = null;
  }

  async run() {
    console.log('🔧 === SETUP DE ADMINISTRADOR ===');
    console.log('📋 Verificando e configurando admin no banco...\n');

    try {
      await this.conectarBanco();
      await this.verificarTabelasAdmin();
      const adminExiste = await this.verificarAdminExistente();
      
      if (!adminExiste) {
        await this.criarAdmin();
      } else {
        console.log('✅ Admin já existe no banco!');
        await this.mostrarInfoAdmin();
      }
      
      await this.verificarRolesAdmin();
      
      console.log('\n🎉 Setup concluído! Admin está pronto para uso.');
      
    } catch (error) {
      console.error('💥 Erro durante o setup:', error.message);
      process.exit(1);
    } finally {
      if (this.db) {
        this.db.close();
      }
    }
  }

  async conectarBanco() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          reject(new Error(`Erro ao conectar com o banco: ${err.message}`));
        } else {
          console.log('📂 Conectado ao banco de dados SQLite');
          resolve();
        }
      });
    });
  }

  async verificarTabelasAdmin() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('usuario', 'role');
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        console.log('📋 Tabelas encontradas:', rows.map(r => r.name).join(', '));
        
        if (rows.length < 2) {
          console.log('⚠️ Algumas tabelas não foram encontradas. Isso pode ser normal se o banco não foi migrado.');
        }
        
        resolve();
      });
    });
  }

  async verificarAdminExistente() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT u.*, r.name as role_name 
        FROM usuario u
        LEFT JOIN role r ON u.id = r.userId
        WHERE u.email = ? AND u.provider = 'local'
      `;
      
      this.db.all(query, [ADMIN_DATA.email], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (rows.length > 0) {
          console.log('✅ Admin encontrado no banco:');
          console.log(`  📧 Email: ${rows[0].email}`);
          console.log(`  👤 Nome: ${rows[0].nome}`);
          console.log(`  🏷️ Roles: ${rows.map(r => r.role_name).filter(Boolean).join(', ')}`);
          console.log(`  📅 Criado em: ${rows[0].createdAt}`);
          resolve(true);
        } else {
          console.log('❌ Admin não encontrado no banco');
          resolve(false);
        }
      });
    });
  }

  async criarAdmin() {
    console.log('🔨 Criando admin no banco...');
    
    // Hash da senha
    const senhaHash = bcrypt.hashSync(ADMIN_DATA.senha, 10);
    console.log(`🔐 Hash da senha gerado: ${senhaHash.substring(0, 20)}...`);
    
    return new Promise((resolve, reject) => {
      // Inserir usuário admin
      const insertUserQuery = `
        INSERT INTO usuario (nome, email, provider, senha, isApproved, isActive, createdAt, updatedAt)
        VALUES (?, ?, 'local', ?, 1, 1, datetime('now'), datetime('now'))
      `;
      
      this.db.run(insertUserQuery, [ADMIN_DATA.nome, ADMIN_DATA.email, senhaHash], function(err) {
        if (err) {
          reject(new Error(`Erro ao criar usuário admin: ${err.message}`));
          return;
        }
        
        const userId = this.lastID;
        console.log(`✅ Usuário admin criado com ID: ${userId}`);
        
        // Inserir role ADMIN
        const insertRoleQuery = `
          INSERT INTO role (name, userId, createdAt, updatedAt)
          VALUES ('ADMIN', ?, datetime('now'), datetime('now'))
        `;
        
        this.db.run(insertRoleQuery, [userId], function(err) {
          if (err) {
            reject(new Error(`Erro ao criar role admin: ${err.message}`));
            return;
          }
          
          console.log('✅ Role ADMIN atribuída ao usuário');
          console.log('🎉 Admin criado com sucesso!');
          console.log('');
          console.log('📋 CREDENCIAIS DO ADMIN:');
          console.log(`  📧 Email: ${ADMIN_DATA.email}`);
          console.log(`  🔐 Senha: ${ADMIN_DATA.senha}`);
          console.log(`  👤 Nome: ${ADMIN_DATA.nome}`);
          console.log('');
          console.log('⚠️ IMPORTANTE: Altere a senha após o primeiro login!');
          
          resolve();
        });
      });
    });
  }

  async mostrarInfoAdmin() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT u.*, r.name as role_name 
        FROM usuario u
        LEFT JOIN role r ON u.id = r.userId
        WHERE u.email = ? AND u.provider = 'local'
      `;
      
      this.db.all(query, [ADMIN_DATA.email], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (rows.length > 0) {
          console.log('📋 INFORMAÇÕES DO ADMIN ATUAL:');
          console.log(`  👤 Nome: ${rows[0].nome}`);
          console.log(`  📧 Email: ${rows[0].email}`);
          console.log(`  🏷️ Roles: ${rows.map(r => r.role_name).filter(Boolean).join(', ')}`);
          console.log(`  ✅ Ativo: ${rows[0].isActive ? 'Sim' : 'Não'}`);
          console.log(`  ✅ Aprovado: ${rows[0].isApproved ? 'Sim' : 'Não'}`);
          console.log(`  📅 Criado em: ${rows[0].createdAt}`);
          console.log('');
          console.log('🔐 CREDENCIAIS PARA LOGIN:');
          console.log(`  📧 Email: ${ADMIN_DATA.email}`);
          console.log(`  🔐 Senha: ${ADMIN_DATA.senha}`);
        }
        
        resolve();
      });
    });
  }

  async verificarRolesAdmin() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT u.id, u.email, r.name as role_name
        FROM usuario u
        LEFT JOIN role r ON u.id = r.userId
        WHERE u.email = ? AND u.provider = 'local'
      `;
      
      this.db.all(query, [ADMIN_DATA.email], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        const adminRows = rows.filter(r => r.role_name === 'ADMIN');
        
        if (adminRows.length === 0 && rows.length > 0) {
          console.log('⚠️ Admin não tem role ADMIN, adicionando...');
          
          const insertRoleQuery = `
            INSERT INTO role (name, userId, createdAt, updatedAt)
            VALUES ('ADMIN', ?, datetime('now'), datetime('now'))
          `;
          
          this.db.run(insertRoleQuery, [rows[0].id], function(err) {
            if (err) {
              reject(new Error(`Erro ao adicionar role ADMIN: ${err.message}`));
            } else {
              console.log('✅ Role ADMIN adicionada ao usuário');
              resolve();
            }
          });
        } else {
          console.log('✅ Admin tem role ADMIN corretamente configurada');
          resolve();
        }
      });
    });
  }
}

// Executar o setup
if (require.main === module) {
  const setup = new AdminSetup();
  setup.run().catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = AdminSetup;
