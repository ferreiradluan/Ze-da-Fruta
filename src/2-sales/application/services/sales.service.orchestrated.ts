import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Pedido } from '../../domain/entities/pedido.entity';
import { Produto } from '../../domain/entities/produto.entity';
import { PedidoRepository } from '../../infrastructure/repositories/pedido.repository';
import { ProdutoRepository } from '../../infrastructure/repositories/produto.repository';
import { EstabelecimentoService } from './estabelecimento.service';
import { CupomService } from './cupom.service';
import { CategoriaService } from './categoria.service';
import { STATUS_PEDIDO, StatusPedido } from '../../domain/types/status-pedido.types';

/**
 * SalesService - REFATORADO PARA ORQUESTRAÇÃO
 * Foca APENAS em orquestração e persistência
 * Toda lógica de negócio está nas entidades
 */
@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    @InjectRepository(Produto)
    private produtoRepository: Repository<Produto>,
    private readonly pedidoRepo: PedidoRepository,
    private readonly produtoRepo: ProdutoRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly estabelecimentoService: EstabelecimentoService,
    private readonly cupomService: CupomService,
    private readonly categoriaService: CategoriaService,
  ) {}

  // ===== MÉTODOS PRINCIPAIS DO DOMÍNIO - ORQUESTRAÇÃO PURA =====
  
  async criarPedido(clienteId: string, dadosSacola: any): Promise<Pedido> {
    // ✅ APENAS orquestração - lógica nas entidades
    const pedido = Pedido.criarNovo(clienteId, dadosSacola);
    
    // Buscar e adicionar produtos (orquestração)
    for (const itemSacola of dadosSacola.itens) {
      const produto = await this.produtoRepo.findById(itemSacola.produtoId);
      if (!produto) {
        throw new BadRequestException(`Produto ${itemSacola.produtoId} não encontrado`);
      }
      pedido.adicionarItem(produto, itemSacola.quantidade);
    }
    
    // Persistir
    const pedidoSalvo = await this.pedidoRepo.save(pedido);
    
    // Publicar eventos de domínio
    const eventos = pedido.getDomainEvents();
    for (const evento of eventos) {
      this.eventEmitter.emit(evento.eventName, evento);
    }
    pedido.clearDomainEvents();
    
    return pedidoSalvo;
  }

  // ✅ APENAS consulta - sem lógica de negócio
  async obterPedido(pedidoId: string, clienteId: string): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOne({
      where: { id: pedidoId, clienteId },
      relations: ['itens', 'itens.produto', 'estabelecimento'],
    });

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return pedido;
  }

  // ✅ APENAS consulta
  async listarProdutosDeLoja(lojaId: string): Promise<Produto[]> {
    return this.produtoRepository.find({
      where: { estabelecimentoId: lojaId, ativo: true },
      relations: ['categoria'],
      order: { nome: 'ASC' },
    });
  }

  // ✅ APENAS consulta
  async obterDetalhesProduto(produtoId: string): Promise<Produto> {
    const produto = await this.produtoRepository.findOne({
      where: { id: produtoId, ativo: true },
      relations: ['categoria', 'estabelecimento'],
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    return produto;
  }

  // ✅ Orquestração com lógica na entidade
  async aplicarCupomAoPedido(pedidoId: string, codigoCupom: string): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOne({
      where: { id: pedidoId },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    const { cupom } = await this.cupomService.validarCupom(
      codigoCupom, 
      pedido.valorSubtotal
    );

    // ✅ Lógica na entidade
    pedido.aplicarCupom(cupom);

    const pedidoAtualizado = await this.pedidoRepository.save(pedido);
    
    // Publicar eventos
    const eventos = pedido.getDomainEvents();
    for (const evento of eventos) {
      this.eventEmitter.emit(evento.eventName, evento);
    }
    pedido.clearDomainEvents();

    return pedidoAtualizado;
  }

  // ✅ Orquestração com lógica na entidade
  async confirmarPedido(pedidoId: string, endereco?: any): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOne({
      where: { id: pedidoId },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // ✅ Lógica na entidade
    pedido.confirmar(endereco);
    
    const pedidoAtualizado = await this.pedidoRepository.save(pedido);
    
    // Publicar eventos
    const eventos = pedido.getDomainEvents();
    for (const evento of eventos) {
      this.eventEmitter.emit(evento.eventName, evento);
    }
    pedido.clearDomainEvents();
    
    return pedidoAtualizado;
  }

  // ===== MÉTODOS DE INTEGRAÇÃO - ORQUESTRAÇÃO =====

  async listarPedidosPorEstabelecimento(estabelecimentoId: string, status?: StatusPedido): Promise<Pedido[]> {
    const where: any = { estabelecimentoId };
    if (status) {
      where.status = status;
    }

    return this.pedidoRepository.find({
      where,
      relations: ['itens', 'itens.produto'],
      order: { createdAt: 'DESC' },
    });
  }

  async buscarProdutosPublico(filtros: any): Promise<Produto[]> {
    const queryBuilder = this.produtoRepository.createQueryBuilder('produto');
    
    queryBuilder
      .leftJoinAndSelect('produto.categoria', 'categoria')
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

  // ===== DELEGAÇÃO PARA CUPOM SERVICE =====
  
  async validarCupom(codigo: string, valorPedido: number) {
    return this.cupomService.validarCupom(codigo, valorPedido);
  }

  async criarCupomGlobal(dadosCupom: any) {
    return this.cupomService.criarCupomGlobal(dadosCupom);
  }

  async desativarCupom(usuario: any, cupomId: string) {
    return this.cupomService.desativarCupom(cupomId);
  }

  async atualizarCupom(usuario: any, cupomId: string, dados: any) {
    // Implementar no CupomService
    throw new Error('Método a ser implementado no CupomService');
  }

  async criarCupom(usuario: any, dados: any) {
    return this.cupomService.criarCupomGlobal(dados);
  }

  async listarCupons(usuario: any) {
    // Implementar no CupomService
    throw new Error('Método a ser implementado no CupomService');
  }

  async buscarCupomPorCodigo(codigo: string) {
    // Implementar no CupomService
    throw new Error('Método a ser implementado no CupomService');
  }
}
