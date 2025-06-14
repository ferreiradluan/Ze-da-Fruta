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
import { StatusPedido } from '../../domain/enums/status-pedido.enum';
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
  ) {}
  // ===== MÉTODOS PRINCIPAIS DO DOMÍNIO - ORQUESTRAÇÃO PURA =====
  
  /**
   * ✅ APENAS orquestração - lógica nas entidades
   */
  async criarPedido(clienteId: string, dadosSacola: SacolaDto): Promise<Pedido> {
    // Usar factory method da entidade para criar o pedido
    const pedido = Pedido.criarNovo(clienteId, dadosSacola);
    
    // Buscar e adicionar produtos (orquestração de infraestrutura)
    for (const itemSacola of dadosSacola.itens) {
      const produto = await this.produtoRepo.findById(itemSacola.produtoId);
      if (!produto) {
        throw new BadRequestException(`Produto ${itemSacola.produtoId} não encontrado`);
      }
      
      // Lógica na entidade
      pedido.adicionarItem(produto, itemSacola.quantidade);
    }
    
    // Persistir
    const pedidoSalvo = await this.pedidoRepo.save(pedido);
    
    // Publicar eventos de domínio (orquestração)
    await this.publishDomainEvents(pedido);
    
    return pedidoSalvo;
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
  }

  /**
   * ✅ APENAS consulta com filtros
   */
  async buscarProdutosPublico(filtros: any): Promise<Produto[]> {
    const queryBuilder = this.produtoRepository.createQueryBuilder('produto');
    
    queryBuilder
      .leftJoinAndSelect('produto.categorias', 'categoria')
      .leftJoinAndSelect('produto.estabelecimento', 'estabelecimento')
      .where('produto.ativo = :ativo', { ativo: true })
      .andWhere('estabelecimento.ativo = :estabelecimentoAtivo', { estabelecimentoAtivo: true });

    if (filtros.nome) {
      queryBuilder.andWhere('produto.nome LIKE :nome', { 
        nome: `%${filtros.nome}%` 
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

  // ===== MÉTODOS PRIVADOS - ORQUESTRAÇÃO =====

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
