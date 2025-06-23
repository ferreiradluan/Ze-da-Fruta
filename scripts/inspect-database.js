#!/usr/bin/env node

/**
 * 🔍 SCRIPT PARA INSPECIONAR O BANCO DE DADOS
 * 
 * Este script verifica:
 * 1. Quais tabelas existem no banco
 * 2. Estrutura das tabelas
 * 3. Dados existentes
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'db', 'ze_da_fruta.sqlite');

class DatabaseInspector {
  constructor() {
    this.db = null;
  }

  async run() {
    console.log('🔍 === INSPEÇÃO DO BANCO DE DADOS ===');
    console.log(`📂 Banco: ${DB_PATH}\n`);

    try {
      await this.conectarBanco();
      await this.listarTabelas();
      await this.inspecionarTabelasUsuarios();
      
    } catch (error) {
      console.error('💥 Erro durante a inspeção:', error.message);
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
          console.log('✅ Conectado ao banco de dados SQLite');
          resolve();
        }
      });
    });
  }

  async listarTabelas() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT name, type FROM sqlite_master 
        WHERE type IN ('table', 'view') 
        ORDER BY name;
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        console.log('📋 TABELAS ENCONTRADAS:');
        if (rows.length === 0) {
          console.log('  ❌ Nenhuma tabela encontrada');
        } else {
          rows.forEach((row, index) => {
            console.log(`  ${index + 1}. ${row.name} (${row.type})`);
          });
        }
        console.log('');
        
        resolve(rows);
      });
    });
  }

  async inspecionarTabelasUsuarios() {
    // Procurar por tabelas relacionadas a usuários
    const possiveisTabelasUsuarios = [
      'usuario', 'user', 'users', 'usuarios',
      'admin', 'admins', 'administrador',
      'role', 'roles', 'permission', 'permissions'
    ];

    for (const nomeTabela of possiveisTabelasUsuarios) {
      await this.verificarTabela(nomeTabela);
    }

    // Verificar todas as tabelas que existem
    await this.verificarTodasTabelas();
  }

  async verificarTabela(nomeTabela) {
    return new Promise((resolve) => {
      // Primeiro verifica se a tabela existe
      const checkQuery = `
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?;
      `;
      
      this.db.get(checkQuery, [nomeTabela], (err, row) => {
        if (err || !row) {
          resolve(); // Tabela não existe, continua
          return;
        }
        
        console.log(`🔍 INSPECIONANDO TABELA: ${nomeTabela}`);
        
        // Obter estrutura da tabela
        this.db.all(`PRAGMA table_info(${nomeTabela})`, [], (err, columns) => {
          if (!err && columns.length > 0) {
            console.log(`  📊 Colunas:`);
            columns.forEach(col => {
              console.log(`    - ${col.name} (${col.type}) ${col.pk ? '🔑 PK' : ''} ${col.notnull ? '❗ NOT NULL' : ''}`);
            });
          }
          
          // Contar registros
          this.db.get(`SELECT COUNT(*) as count FROM ${nomeTabela}`, [], (err, result) => {
            if (!err) {
              console.log(`  📈 Registros: ${result.count}`);
              
              // Se tem poucos registros, mostrar alguns dados
              if (result.count > 0 && result.count <= 10) {
                this.db.all(`SELECT * FROM ${nomeTabela} LIMIT 5`, [], (err, rows) => {
                  if (!err && rows.length > 0) {
                    console.log(`  📋 Primeiros registros:`);
                    rows.forEach((row, index) => {
                      console.log(`    ${index + 1}. ${JSON.stringify(row, null, 2).substring(0, 100)}...`);
                    });
                  }
                  console.log('');
                  resolve();
                });
              } else {
                console.log('');
                resolve();
              }
            } else {
              console.log('');
              resolve();
            }
          });
        });
      });
    });
  }

  async verificarTodasTabelas() {
    return new Promise((resolve, reject) => {
      const query = `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;`;
      
      this.db.all(query, [], async (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        console.log('🔍 VERIFICANDO TODAS AS TABELAS EXISTENTES:\n');
        
        for (const row of rows) {
          await this.verificarTabela(row.name);
        }
        
        resolve();
      });
    });
  }
}

// Executar a inspeção
if (require.main === module) {
  const inspector = new DatabaseInspector();
  inspector.run().catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = DatabaseInspector;
