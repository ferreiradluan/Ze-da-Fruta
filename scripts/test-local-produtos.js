#!/usr/bin/env node

/**
 * 🔍 DEBUG LOCAL - TESTE DO MÉTODO buscarProdutosPublico
 * 
 * Vamos testar localmente o método buscarProdutosPublico para entender
 * por que está retornando array vazio quando deveria retornar produtos.
 */

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../src/app.module');

async function testLocalProductListing() {
  console.log('🚀 Iniciando teste local da busca de produtos...');
  
  try {
    // Criar aplicação NestJS
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // Obter instância do SalesService
    const { SalesService } = require('../src/2-sales/application/services/sales.service');
    const salesService = app.get(SalesService);
    
    console.log('✅ Aplicação NestJS iniciada com sucesso');
    
    // 1. Testar busca básica de produtos
    console.log('\n1️⃣ Testando busca básica de produtos...');
    const produtos = await salesService.buscarProdutosPublico({});
    
    console.log(`📊 Resultado: ${produtos.length} produtos encontrados`);
    
    if (produtos.length > 0) {
      console.log('✅ Produtos encontrados:');
      produtos.forEach((produto, index) => {
        console.log(`   ${index + 1}. ${produto.nome} - R$ ${produto.preco} - Ativo: ${produto.ativo}`);
      });
    } else {
      console.log('❌ Nenhum produto encontrado');
    }
    
    // 2. Verificar produtos no banco diretamente
    console.log('\n2️⃣ Verificando produtos diretamente no banco...');
    const { getRepository } = require('typeorm');
    const { Produto } = require('../src/2-sales/domain/entities/produto.entity');
    
    const produtoRepository = app.get('ProdutoRepository');
    const todosProdutos = await produtoRepository.find();
    
    console.log(`📊 Total de produtos no banco: ${todosProdutos.length}`);
    
    if (todosProdutos.length > 0) {
      console.log('📦 Todos os produtos no banco:');
      todosProdutos.forEach((produto, index) => {
        console.log(`   ${index + 1}. ${produto.nome} - R$ ${produto.preco} - Ativo: ${produto.ativo} - Disponível: ${produto.disponivel}`);
      });
    }
    
    // 3. Verificar produtos ativos
    console.log('\n3️⃣ Verificando apenas produtos ativos...');
    const produtosAtivos = await produtoRepository.find({
      where: { ativo: true }
    });
    
    console.log(`📊 Produtos ativos: ${produtosAtivos.length}`);
    
    // 4. Testar query com joins
    console.log('\n4️⃣ Testando query com joins...');
    const produtosComJoins = await produtoRepository.createQueryBuilder('produto')
      .leftJoinAndSelect('produto.categorias', 'categoria')
      .leftJoinAndSelect('produto.estabelecimento', 'estabelecimento')
      .where('produto.ativo = :ativo', { ativo: true })
      .getMany();
    
    console.log(`📊 Produtos com joins: ${produtosComJoins.length}`);
    
    if (produtosComJoins.length > 0) {
      console.log('🔗 Produtos com relações:');
      produtosComJoins.forEach((produto, index) => {
        console.log(`   ${index + 1}. ${produto.nome} - Estabelecimento: ${produto.estabelecimento?.nome || 'N/A'} - Categorias: ${produto.categorias?.length || 0}`);
      });
    }
    
    await app.close();
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error);
    process.exit(1);
  }
}

// Executar teste
testLocalProductListing()
  .then(() => {
    console.log('\n✅ Teste concluído com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro durante execução:', error);
    process.exit(1);
  });
