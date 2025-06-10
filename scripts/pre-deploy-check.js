#!/usr/bin/env node

/**
 * Script de verificação pré-deploy
 * Verifica se tudo está configurado corretamente antes do deploy
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Verificando configuração pré-deploy...');

const checks = [];

// 1. Verificar se package.json existe e tem scripts necessários
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['build', 'start:prod', 'heroku-postbuild', 'seed:prod'];
  
  for (const script of requiredScripts) {
    if (packageJson.scripts[script]) {
      checks.push(`✅ Script '${script}' encontrado`);
    } else {
      checks.push(`❌ Script '${script}' ausente`);
    }
  }
} catch (error) {
  checks.push('❌ Erro lendo package.json');
}

// 2. Verificar se Procfile existe
if (fs.existsSync('Procfile')) {
  checks.push('✅ Procfile encontrado');
} else {
  checks.push('❌ Procfile ausente');
}

// 3. Verificar se arquivos essenciais existem
const essentialFiles = [
  'src/main.ts',
  'src/app.module.ts',
  'scripts/heroku-setup.js',
  'scripts/seed-prod.js'
];

for (const file of essentialFiles) {
  if (fs.existsSync(file)) {
    checks.push(`✅ ${file} encontrado`);
  } else {
    checks.push(`❌ ${file} ausente`);
  }
}

// 4. Verificar se pode fazer build
try {
  console.log('\n🔨 Testando build...');
  execSync('npm run build', { stdio: 'pipe' });
  checks.push('✅ Build executado com sucesso');
} catch (error) {
  checks.push('❌ Erro no build');
}

// 5. Verificar se dist foi criado
if (fs.existsSync('dist')) {
  checks.push('✅ Pasta dist criada');
} else {
  checks.push('❌ Pasta dist não criada');
}

// 6. Verificar se .gitignore está configurado
try {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  if (gitignore.includes('*.sqlite')) {
    checks.push('✅ .gitignore configurado para SQLite');
  } else {
    checks.push('⚠️  .gitignore pode não estar configurado para SQLite');
  }
} catch (error) {
  checks.push('⚠️  .gitignore não encontrado');
}

// 7. Verificar pastas de upload
const uploadDirs = ['uploads/profile', 'uploads/product', 'uploads/establishment'];
for (const dir of uploadDirs) {
  if (fs.existsSync(dir)) {
    checks.push(`✅ ${dir} existe`);
  } else {
    checks.push(`⚠️  ${dir} não existe`);
  }
}

// Mostrar resultados
console.log('\n📋 Resultados da verificação:');
checks.forEach(check => console.log(check));

// Verificar se há erros críticos
const errors = checks.filter(check => check.includes('❌'));
const warnings = checks.filter(check => check.includes('⚠️'));

console.log(`\n📊 Resumo:`);
console.log(`✅ Sucessos: ${checks.filter(c => c.includes('✅')).length}`);
console.log(`⚠️  Avisos: ${warnings.length}`);
console.log(`❌ Erros: ${errors.length}`);

if (errors.length === 0) {
  console.log('\n🎉 Sistema pronto para deploy!');
  console.log('\n🚀 Para fazer deploy:');
  console.log('node scripts/deploy-heroku.js seu-app-nome');
  process.exit(0);
} else {
  console.log('\n❌ Corrija os erros antes de fazer deploy.');
  process.exit(1);
}
