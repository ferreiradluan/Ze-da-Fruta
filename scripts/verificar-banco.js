const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./db/ze_da_fruta.sqlite');

console.log('=== VERIFICAÇÃO DO BANCO ===');

db.all('SELECT COUNT(*) as total FROM categoria', (err, rows) => {
  if (!err) console.log('✅ Categorias:', rows[0].total);
});

db.all('SELECT COUNT(*) as total FROM produto', (err, rows) => {
  if (!err) console.log('✅ Produtos:', rows[0].total);
});

db.all('SELECT COUNT(*) as total FROM estabelecimento', (err, rows) => {
  if (!err) console.log('✅ Estabelecimentos:', rows[0].total);
});

db.all('SELECT nome, preco, unidadeMedida FROM produto LIMIT 5', (err, rows) => {
  if (!err) {
    console.log('\n📦 PRODUTOS (amostra):');
    rows.forEach(p => {
      console.log(`  • ${p.nome}: R$ ${p.preco}/${p.unidadeMedida}`);
    });
  }
  
  db.close(() => {
    console.log('\n🎉 Verificação concluída!');
  });
});
