import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Pedido } from '../../domain/entities/pedido.entity';
import { Produto } from '../../domain/entities/produto.entity';
import { Estabelecimento } from '../../domain/entities/estabelecimento.entity';
import { Categoria } from '../../domain/entities/categoria.entity';
import { PedidoRepository } from '../../infrastructure/repositories/pedido.repository';
import { ProdutoRepository } from '../../infrastructure/repositories/produto.repository';
import { CupomService } from './cupom.service';
import { STATUS_PEDIDO, StatusPedido } from '../../domain/types/status-pedido.types';
import { SacolaDto } from '../../domain/entities/pedido.entity';

/**
 * 🔧 FASE 3: SALESSERVICE REFATORADO PARA ORQUESTRAÇÃO PURA
 * 
 * ✅ APENAS orquestração, consulta e persistência
 * ✅ Toda lógica de negócio está nas entidades
 * ✅ Events bus para comunicação entre bounded contexts
 */
@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    @InjectRepository(Produto)
    private produtoRepository: Repository<Produto>,
    @InjectRepository(Estabelecimento)
    private estabelecimentoRepository: Repository<Estabelecimento>,
    @InjectRepository(Categoria)
    private categoriaRepository: Repository<Categoria>,
    private readonly pedidoRepo: PedidoRepository,
    private readonly produtoRepo: ProdutoRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly cupomService: CupomService,
  ) {}  // ===== MÉTODOS PRINCIPAIS DO DOMÍNIO - ORQUESTRAÇÃO PURA =====
  
  /**
   * APENAS orquestracao - logica nas entidades
   */
  async criarPedido(clienteId: string, dadosSacola: SacolaDto): Promise<Pedido> {
    try {
      console.log('Iniciando criacao de pedido:', { clienteId, dadosSacola });
      
      // Usar factory method da entidade para criar o pedido (sem itens ainda)
      const pedido = Pedido.criarNovo(clienteId, dadosSacola);
      console.log('Pedido criado via factory method');
      
      // Salvar primeiro o pedido vazio para obter o ID
      const pedidoComId = await this.pedidoRepository.save(pedido);
      console.log('Pedido salvo com ID:', pedidoComId.id);
      
      // Agora buscar e adicionar produtos com o pedido ja tendo ID
      for (const itemSacola of dadosSacola.itens) {
        console.log('Buscando produto:', itemSacola.produtoId);
        const produto = await this.produtoRepo.findById(itemSacola.produtoId);
        if (!produto) {
          throw new BadRequestException(`Produto ${itemSacola.produtoId} nao encontrado`);
        }
        console.log('Produto encontrado:', produto.nome);
        
        // Logica na entidade - agora o pedido ja tem ID
        pedidoComId.adicionarItem(produto, itemSacola.quantidade);
        console.log('Item adicionado ao pedido');
      }
      
      // Salvar novamente com os itens
      const pedidoFinal = await this.pedidoRepository.save(pedidoComId);
      console.log('Pedido final salvo');
      
      // Publicar eventos de dominio (orquestracao)
      await this.publishDomainEvents(pedidoFinal);
      console.log('Eventos publicados');
      
      return pedidoFinal;
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }
  }

  /**
   * ✅ APENAS consulta - sem lógica de negócio
   */
  async obterPedido(pedidoId: string, clienteId: string): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOne({
      where: { id: pedidoId, clienteId },
      relations: ['itens', 'itens.produto', 'cupom'],
    });

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return pedido;
  }

  /**
   * ✅ APENAS consulta
   */
  async listarProdutosDeLoja(lojaId: string): Promise<Produto[]> {
    return this.produtoRepository.find({
      where: { estabelecimentoId: lojaId, ativo: true },
      relations: ['categorias'],
      order: { nome: 'ASC' },
    });
  }

  /**
   * ✅ APENAS consulta
   */
  async obterDetalhesProduto(produtoId: string): Promise<Produto> {
    const produto = await this.produtoRepository.findOne({
      where: { id: produtoId, ativo: true },
      relations: ['categorias', 'estabelecimento'],
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    return produto;
  }

  /**
   * ✅ Orquestração com lógica na entidade
   */
  async aplicarCupomAoPedido(pedidoId: string, codigoCupom: string): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOne({
      where: { id: pedidoId },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Orquestração: validar cupom via service especializado
    const { cupom } = await this.cupomService.validarCupom(
      codigoCupom, 
      pedido.valorSubtotal
    );

    // Lógica na entidade
    pedido.aplicarCupom(cupom);

    const pedidoAtualizado = await this.pedidoRepository.save(pedido);
    
    // Publicar eventos
    await this.publishDomainEvents(pedido);

    return pedidoAtualizado;
  }

  /**
   * ✅ Orquestração com lógica na entidade
   */
  async confirmarPedido(pedidoId: string, endereco?: any): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOne({
      where: { id: pedidoId },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Lógica na entidade
    pedido.confirmar(endereco);
    
    const pedidoAtualizado = await this.pedidoRepository.save(pedido);
    
    // Publicar eventos
    await this.publishDomainEvents(pedido);
    
    return pedidoAtualizado;
  }
  // ===== MÉTODOS DE CONSULTA PÚBLICA =====

  /**
   * ✅ APENAS consulta
   */
  async listarCategoriasPublico(): Promise<Categoria[]> {
    return this.categoriaRepository.find({
      where: { ativo: true },
      order: { nome: 'ASC' }
    });
  }

  /**
   * ✅ APENAS consulta
   */
  async listarEstabelecimentosPublico(): Promise<Estabelecimento[]> {
    return this.estabelecimentoRepository.find({
      where: { ativo: true },
      select: ['id', 'nome', 'descricao', 'endereco', 'telefone', 'imagemUrl'],
      order: { nome: 'ASC' }
    });
  }  /**
   * ✅ APENAS consulta com filtros - VERSÃO SIMPLIFICADA PARA DEBUG
   */  async buscarProdutosPublico(filtros: any): Promise<Produto[]> {
    console.log('🚨 INICIANDO buscarProdutosPublico com filtros:', filtros);
    
    // Primeiro tentar uma busca simples sem joins
    try {
      console.log('🔍 Tentando busca simples...');
      const produtosSimples = await this.produtoRepository.find({
        where: { ativo: true },
        take: 50
      });
      
      console.log(`🔍 DEBUG: Encontrados ${produtosSimples.length} produtos simples`);
      
      if (produtosSimples.length > 0) {
        console.log('✅ Retornando produtos simples:', produtosSimples.map(p => ({ id: p.id, nome: p.nome, ativo: p.ativo })));
        return produtosSimples;
      }
    } catch (error) {
      console.error('❌ Erro na busca simples:', error);
    }

    console.log('🔍 Iniciando busca com joins...');
    
    // Se não encontrou produtos simples, tentar com joins
    const queryBuilder = this.produtoRepository.createQueryBuilder('produto');
    
    queryBuilder
      .leftJoinAndSelect('produto.categorias', 'categoria')
      .leftJoinAndSelect('produto.estabelecimento', 'estabelecimento')
      .where('produto.ativo = :ativo', { ativo: true });

    console.log('🔍 Query básica criada, aplicando filtros...');

    // Só aplicar filtro de estabelecimento ativo se há estabelecimento
    queryBuilder.andWhere('(produto.estabelecimentoId IS NULL OR estabelecimento.ativo = :estabelecimentoAtivo)', { 
      estabelecimentoAtivo: true 
    });

    if (filtros.nome) {
      queryBuilder.andWhere('produto.nome LIKE :nome', { 
        nome: `%${filtros.nome}%` 
      });
    }

    if (filtros.search) {
      queryBuilder.andWhere('produto.nome LIKE :search', { 
        search: `%${filtros.search}%` 
      });
    }

    if (filtros.categoria) {
      queryBuilder.andWhere('categoria.nome = :categoria', { categoria: filtros.categoria });
    }

    if (filtros.estabelecimento) {
      queryBuilder.andWhere('estabelecimento.nome LIKE :estabelecimento', { 
        estabelecimento: `%${filtros.estabelecimento}%` 
      });
    }

    const resultado = await queryBuilder
      .orderBy('produto.nome', 'ASC')
      .getMany();
      
    console.log(`🔍 DEBUG: Encontrados ${resultado.length} produtos com joins`);
    return resultado;
  }

  /**
   * ✅ Buscar produtos disponíveis (ativo = true e estoque > 0)
   */
  async buscarProdutosDisponiveis(): Promise<Produto[]> {
    const queryBuilder = this.produtoRepository.createQueryBuilder('produto');
    
    queryBuilder
      .leftJoinAndSelect('produto.categorias', 'categoria')
      .leftJoinAndSelect('produto.estabelecimento', 'estabelecimento')
      .where('produto.ativo = :ativo', { ativo: true })
      .andWhere('estabelecimento.ativo = :estabelecimentoAtivo', { estabelecimentoAtivo: true })
      .andWhere('produto.estoque > :estoque', { estoque: 0 });

    return queryBuilder
      .orderBy('produto.nome', 'ASC')
      .getMany();
  }

  // ===== MÉTODOS DE DELEGAÇÃO PARA CUPOM SERVICE =====
  
  async validarCupom(codigo: string, valorPedido: number) {
    return this.cupomService.validarCupom(codigo, valorPedido);
  }

  async criarCupomGlobal(dadosCupom: any) {
    return this.cupomService.criarCupomGlobal(dadosCupom);
  }

  async desativarCupom(cupomId: string) {
    return this.cupomService.desativarCupom(cupomId);
  }

  // ===== MÉTODOS AUSENTES PARA RESOLVER ERROS DE BUILD =====

  /**
   * ✅ Listar pedidos por estabelecimento
   */
  async listarPedidosPorEstabelecimento(estabelecimentoId: string, status?: string): Promise<Pedido[]> {
    const where: any = { estabelecimentoId };
    if (status) {
      where.status = status;
    }
    
    return this.pedidoRepository.find({
      where,
      relations: ['itens', 'itens.produto'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * ✅ Buscar produtos com filtros
   */
  async buscarProdutosComFiltros(filtros: any): Promise<Produto[]> {
    const queryBuilder = this.produtoRepository.createQueryBuilder('produto')
      .leftJoinAndSelect('produto.estabelecimento', 'estabelecimento')
      .leftJoinAndSelect('produto.categorias', 'categorias');

    if (filtros.categoria) {
      queryBuilder.andWhere('categorias.nome = :categoria', { categoria: filtros.categoria });
    }

    if (filtros.estabelecimentoId) {
      queryBuilder.andWhere('produto.estabelecimentoId = :estabelecimentoId', { 
        estabelecimentoId: filtros.estabelecimentoId 
      });
    }

    if (filtros.busca) {
      queryBuilder.andWhere('produto.nome ILIKE :busca', { busca: `%${filtros.busca}%` });
    }

    if (filtros.disponivel !== undefined) {
      queryBuilder.andWhere('produto.disponivel = :disponivel', { disponivel: filtros.disponivel });
    }

    return queryBuilder.getMany();
  }

  /**
   * ✅ Buscar produtos por categoria
   */
  async buscarProdutosPorCategoria(categoriaId: string): Promise<Produto[]> {
    const queryBuilder = this.produtoRepository.createQueryBuilder('produto');
    
    queryBuilder
      .leftJoinAndSelect('produto.categorias', 'categoria')
      .leftJoinAndSelect('produto.estabelecimento', 'estabelecimento')
      .where('produto.ativo = :ativo', { ativo: true })
      .andWhere('estabelecimento.ativo = :estabelecimentoAtivo', { estabelecimentoAtivo: true })
      .andWhere('categoria.id = :categoriaId', { categoriaId });

    return queryBuilder
      .orderBy('produto.nome', 'ASC')
      .getMany();
  }

  /**
   * ✅ Buscar estabelecimentos públicos
   */
  async buscarEstabelecimentosPublico(filtros: any): Promise<Estabelecimento[]> {
    const queryBuilder = this.estabelecimentoRepository.createQueryBuilder('estabelecimento');
    
    queryBuilder.where('estabelecimento.ativo = :ativo', { ativo: true });

    if (filtros.ativo !== undefined) {
      queryBuilder.andWhere('estabelecimento.ativo = :filtroAtivo', { filtroAtivo: filtros.ativo });
    }

    if (filtros.search) {
      queryBuilder.andWhere('estabelecimento.nome LIKE :nome', { 
        nome: `%${filtros.search}%` 
      });
    }

    return queryBuilder
      .orderBy('estabelecimento.nome', 'ASC')
      .getMany();
  }

  /**
   * ✅ Obter detalhes de um estabelecimento
   */
  async obterDetalhesEstabelecimento(id: string): Promise<Estabelecimento> {
    const estabelecimento = await this.estabelecimentoRepository.findOne({
      where: { id, ativo: true },
      relations: ['produtos']
    });
    
    if (!estabelecimento) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }
    
    return estabelecimento;
  }

  /**
   * ✅ Helper para publicar eventos de domínio
   */
  private async publishDomainEvents(entity: { getDomainEvents(): any[]; clearDomainEvents(): void }): Promise<void> {
    const eventos = entity.getDomainEvents();
    for (const evento of eventos) {
      this.eventEmitter.emit(evento.eventName, evento);
    }
    entity.clearDomainEvents();
  }
}
