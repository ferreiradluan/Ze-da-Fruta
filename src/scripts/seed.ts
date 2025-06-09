import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Categoria } from '../2-sales/domain/entities/categoria.entity';
import { Estabelecimento } from '../2-sales/domain/entities/estabelecimento.entity';
import { Produto } from '../2-sales/domain/entities/produto.entity';

async function seed() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);

  // Repositórios
  const categoriaRepo = dataSource.getRepository(Categoria);
  const estabelecimentoRepo = dataSource.getRepository(Estabelecimento);
  const produtoRepo = dataSource.getRepository(Produto);

  console.log('🌱 Iniciando seed dos dados...');

  // Criar categorias
  const categorias = [
    { nome: 'Frutas', descricao: 'Frutas frescas e selecionadas' },
    { nome: 'Verduras', descricao: 'Verduras e folhosas' },
    { nome: 'Legumes', descricao: 'Legumes frescos' },
    { nome: 'Temperos', descricao: 'Temperos e ervas' },
    { nome: 'Orgânicos', descricao: 'Produtos orgânicos certificados' }
  ];
  const categoriasCreated: Categoria[] = [];
  for (const cat of categorias) {
    let categoria = await categoriaRepo.findOne({ where: { nome: cat.nome } });
    if (!categoria) {
      categoria = categoriaRepo.create(cat);
      categoria = await categoriaRepo.save(categoria);
      console.log(`✅ Categoria criada: ${categoria.nome}`);
    }
    categoriasCreated.push(categoria);
  }
  // Criar estabelecimentos
  const estabelecimentos = [
    {
      nome: 'Hortifruti Central',
      cnpj: '12.345.678/0001-90',
      endereco: 'Rua das Flores, 123 - Centro',
      telefone: '(11) 99999-1111',
      email: 'contato@hortifruticentral.com',
      descricao: 'Estabelecimento tradicional no centro da cidade',
      estaAberto: true,
      latitude: -23.5505,
      longitude: -46.6333
    },
    {
      nome: 'Feira do Produtor',
      cnpj: '98.765.432/0001-10',
      endereco: 'Avenida dos Produtores, 456 - Vila Madalena',
      telefone: '(11) 99999-2222',
      email: 'contato@feiradoprodutor.com',
      descricao: 'Produtos direto do produtor',
      estaAberto: true,
      latitude: -23.5489,
      longitude: -46.6388
    },
    {
      nome: 'Orgânicos & Cia',
      cnpj: '11.222.333/0001-44',
      endereco: 'Rua Verde, 789 - Jardins',
      telefone: '(11) 99999-3333',
      email: 'contato@organicosecia.com',
      descricao: 'Especialista em produtos orgânicos',
      estaAberto: true,
      latitude: -23.5615,
      longitude: -46.6565
    }
  ];
  const estabelecimentosCreated: Estabelecimento[] = [];
  for (const est of estabelecimentos) {
    let estabelecimento = await estabelecimentoRepo.findOne({ where: { nome: est.nome } });
    if (!estabelecimento) {
      estabelecimento = estabelecimentoRepo.create(est);
      estabelecimento = await estabelecimentoRepo.save(estabelecimento);
      console.log(`✅ Estabelecimento criado: ${estabelecimento.nome}`);
    }
    estabelecimentosCreated.push(estabelecimento);
  }

  // Criar produtos
  const produtos = [
    // Frutas
    {
      nome: 'Maçã Gala',
      preco: 5.99,
      descricao: 'Maçã Gala doce e crocante',
      estoque: 100,
      unidadeMedida: 'kg',
      categoria: categoriasCreated[0], // Frutas
      estabelecimento: estabelecimentosCreated[0]
    },
    {
      nome: 'Banana Prata',
      preco: 3.49,
      descricao: 'Banana prata madura',
      estoque: 80,
      unidadeMedida: 'kg',
      categoria: categoriasCreated[0], // Frutas
      estabelecimento: estabelecimentosCreated[0]
    },
    {
      nome: 'Laranja Pera',
      preco: 4.99,
      descricao: 'Laranja pera suculenta',
      estoque: 120,
      unidadeMedida: 'kg',
      categoria: categoriasCreated[0], // Frutas
      estabelecimento: estabelecimentosCreated[1]
    },
    // Verduras
    {
      nome: 'Alface Crespa',
      preco: 2.99,
      descricao: 'Alface crespa fresca',
      estoque: 50,
      unidadeMedida: 'unidade',
      categoria: categoriasCreated[1], // Verduras
      estabelecimento: estabelecimentosCreated[0]
    },
    {
      nome: 'Rúcula',
      preco: 3.99,
      descricao: 'Rúcula orgânica',
      estoque: 30,
      unidadeMedida: 'maço',
      categoria: categoriasCreated[1], // Verduras
      estabelecimento: estabelecimentosCreated[2]
    },
    // Legumes
    {
      nome: 'Tomate Italiano',
      preco: 6.99,
      descricao: 'Tomate italiano maduro',
      estoque: 70,
      unidadeMedida: 'kg',
      categoria: categoriasCreated[2], // Legumes
      estabelecimento: estabelecimentosCreated[1]
    },
    {
      nome: 'Cenoura',
      preco: 4.49,
      descricao: 'Cenoura doce e crocante',
      estoque: 90,
      unidadeMedida: 'kg',
      categoria: categoriasCreated[2], // Legumes
      estabelecimento: estabelecimentosCreated[0]
    },
    // Temperos
    {
      nome: 'Manjericão',
      preco: 2.49,
      descricao: 'Manjericão fresco',
      estoque: 25,
      unidadeMedida: 'maço',
      categoria: categoriasCreated[3], // Temperos
      estabelecimento: estabelecimentosCreated[2]
    },
    // Orgânicos
    {
      nome: 'Alface Orgânica',
      preco: 4.99,
      descricao: 'Alface orgânica certificada',
      estoque: 40,
      unidadeMedida: 'unidade',
      categoria: categoriasCreated[4], // Orgânicos
      estabelecimento: estabelecimentosCreated[2]
    },
    {
      nome: 'Tomate Orgânico',
      preco: 8.99,
      descricao: 'Tomate orgânico certificado',
      estoque: 35,
      unidadeMedida: 'kg',
      categoria: categoriasCreated[4], // Orgânicos
      estabelecimento: estabelecimentosCreated[2]
    }
  ];
  for (const prod of produtos) {
    let produto = await produtoRepo.findOne({ 
      where: { nome: prod.nome, estabelecimento: { id: prod.estabelecimento.id } },
      relations: ['categorias', 'estabelecimento']
    });
    if (!produto) {
      produto = produtoRepo.create({
        nome: prod.nome,
        preco: prod.preco,
        descricao: prod.descricao,
        estoque: prod.estoque,
        unidadeMedida: prod.unidadeMedida,
        disponivel: true,
        ativo: true,
        estabelecimentoId: prod.estabelecimento.id,
        categorias: [prod.categoria] // Array para relacionamento Many-to-Many
      });
      produto = await produtoRepo.save(produto);
      console.log(`✅ Produto criado: ${produto.nome} - R$ ${produto.preco}`);
    }
  }

  console.log('🎉 Seed completado com sucesso!');
  await app.close();
}

seed().catch(console.error);
