#!/usr/bin/env node

/**
 * 🔍 DEBUG LOCAL - TESTE DO BANCO DE DADOS DIRETAMENTE
 * 
 * Vamos testar localmente o banco SQLite para ver se existem produtos
 * e qual é a estrutura atual da tabela.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function testLocalDatabase() {
  console.log('🚀 Iniciando teste do banco de dados local...');
  
  // Caminho para o banco SQLite
  const dbPath = path.join(__dirname, '..', 'db', 'ze_da_fruta.sqlite');
  console.log(`📂 Caminho do banco: ${dbPath}`);
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Erro ao conectar no banco:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Conectado ao banco SQLite local');
    });
    
    // 1. Verificar se a tabela produto existe
    console.log('\n1️⃣ Verificando estrutura da tabela produto...');
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%produto%'", (err, tables) => {
      if (err) {
        console.error('❌ Erro ao buscar tabelas:', err.message);
        return;
      }
      
      console.log('📋 Tabelas encontradas:', tables.map(t => t.name));
      
      // 2. Verificar estrutura da tabela produto
      if (tables.length > 0) {
        const tableName = tables[0].name;
        db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
          if (err) {
            console.error('❌ Erro ao buscar estrutura da tabela:', err.message);
            return;
          }
          
          console.log(`\n2️⃣ Estrutura da tabela ${tableName}:`);
          columns.forEach(col => {
            console.log(`   - ${col.name}: ${col.type} (NOT NULL: ${col.notnull}, DEFAULT: ${col.dflt_value})`);
          });
          
          // 3. Contar total de produtos
          db.get(`SELECT COUNT(*) as total FROM ${tableName}`, (err, count) => {
            if (err) {
              console.error('❌ Erro ao contar produtos:', err.message);
              return;
            }
            
            console.log(`\n3️⃣ Total de produtos no banco: ${count.total}`);
            
            // 4. Buscar produtos ativos
            db.all(`SELECT * FROM ${tableName} WHERE ativo = 1`, (err, produtos) => {
              if (err) {
                console.error('❌ Erro ao buscar produtos ativos:', err.message);
                return;
              }
              
              console.log(`\n4️⃣ Produtos ativos encontrados: ${produtos.length}`);
              
              if (produtos.length > 0) {
                console.log('📦 Lista de produtos ativos:');
                produtos.forEach((produto, index) => {
                  console.log(`   ${index + 1}. ${produto.nome} - R$ ${produto.preco} - Ativo: ${produto.ativo} - Disponível: ${produto.disponivel}`);
                });
              }
              
              // 5. Buscar todos os produtos (ativos e inativos)
              db.all(`SELECT * FROM ${tableName}`, (err, todosProdutos) => {
                if (err) {
                  console.error('❌ Erro ao buscar todos os produtos:', err.message);
                  return;
                }
                
                console.log(`\n5️⃣ Todos os produtos (ativos e inativos): ${todosProdutos.length}`);
                
                if (todosProdutos.length > 0) {
                  console.log('📦 Lista completa de produtos:');
                  todosProdutos.forEach((produto, index) => {
                    console.log(`   ${index + 1}. ${produto.nome} - R$ ${produto.preco} - Ativo: ${produto.ativo} - Disponível: ${produto.disponivel || 'N/A'}`);
                  });
                }
                
                // 6. Verificar tabela de estabelecimentos
                db.all("SELECT * FROM estabelecimento", (err, estabelecimentos) => {
                  if (err) {
                    console.log('⚠️ Tabela estabelecimento não encontrada ou vazia');
                  } else {
                    console.log(`\n6️⃣ Estabelecimentos encontrados: ${estabelecimentos.length}`);
                    estabelecimentos.forEach(est => {
                      console.log(`   - ${est.nome} (Ativo: ${est.ativo})`);
                    });
                  }
                  
                  // 7. Verificar tabela de categorias
                  db.all("SELECT * FROM categoria", (err, categorias) => {
                    if (err) {
                      console.log('⚠️ Tabela categoria não encontrada ou vazia');
                    } else {
                      console.log(`\n7️⃣ Categorias encontradas: ${categorias.length}`);
                      categorias.forEach(cat => {
                        console.log(`   - ${cat.nome} (Ativo: ${cat.ativo || 'N/A'})`);
                      });
                    }
                    
                    // Fechar conexão
                    db.close((err) => {
                      if (err) {
                        console.error('❌ Erro ao fechar banco:', err.message);
                        reject(err);
                      } else {
                        console.log('\n✅ Teste concluído com sucesso!');
                        resolve();
                      }
                    });
                  });
                });
              });
            });
          });
        });
      } else {
        console.log('❌ Nenhuma tabela de produto encontrada');
        db.close();
        resolve();
      }
    });
  });
}

// Executar teste
testLocalDatabase()
  .then(() => {
    console.log('\n🎉 Diagnóstico concluído!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro durante execução:', error);
    process.exit(1);
  });
