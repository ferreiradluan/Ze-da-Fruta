#!/usr/bin/env node

/**
 * VERIFICAR ESTRUTURA DO BANCO
 * Verifica se as tabelas existem e qual sua estrutura
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../db/ze_da_fruta.sqlite');

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

async function main() {
  console.log(`📁 Verificando banco: ${dbPath}`);
  
  const db = new sqlite3.Database(dbPath);
  
  try {
    // Listar todas as tabelas
    console.log('\n📋 TABELAS EXISTENTES:');
    const tables = await querySql(db, "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    
    if (tables.length === 0) {
      console.log('❌ Nenhuma tabela encontrada no banco!');
      return;
    }
    
    for (const table of tables) {
      console.log(`   • ${table.name}`);
    }
    
    // Verificar estrutura das principais tabelas
    const mainTables = ['estabelecimento', 'categoria', 'produto', 'produto_categoria'];
    
    for (const tableName of mainTables) {
      try {
        console.log(`\n🔍 ESTRUTURA DA TABELA: ${tableName}`);
        const columns = await querySql(db, `PRAGMA table_info(${tableName})`);
        
        if (columns.length === 0) {
          console.log(`   ❌ Tabela ${tableName} não existe`);
        } else {
          columns.forEach(col => {
            const pk = col.pk ? ' (PK)' : '';
            const notNull = col.notnull ? ' NOT NULL' : '';
            const defaultVal = col.dflt_value ? ` DEFAULT ${col.dflt_value}` : '';
            console.log(`   • ${col.name}: ${col.type}${pk}${notNull}${defaultVal}`);
          });
        }
      } catch (err) {
        console.log(`   ❌ Erro ao verificar ${tableName}: ${err.message}`);
      }
    }
    
    // Contar registros
    console.log('\n📊 CONTAGEM DE REGISTROS:');
    for (const tableName of mainTables) {
      try {
        const count = await querySql(db, `SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`   • ${tableName}: ${count[0].count} registros`);
      } catch (err) {
        console.log(`   • ${tableName}: Tabela não existe ou erro`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    db.close();
  }
}

main().catch(console.error);
