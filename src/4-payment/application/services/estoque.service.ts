import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Produto } from '../../../2-sales/domain/entities/produto.entity';
import { Pedido } from '../../../2-sales/domain/entities/pedido.entity';
import { EventBusService } from '../../../common/event-bus';

@Injectable()
export class EstoqueService {
  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,
    private readonly eventBusService: EventBusService,
  ) {}

  // ===== EVENT HANDLERS REAIS =====

  /**
   * Handler REAL: Reserva estoque quando pagamento é aprovado
   */
  @OnEvent('pagamento.aprovado')
  async handlePagamentoAprovado(event: any): Promise<void> {
    try {
      console.log('📦 Reservando estoque para pagamento aprovado:', {
        pedidoId: event.payload.pedidoId,
        valor: event.payload.valor
      });

      await this.reservarEstoque(event.payload.pedidoId);

      // Emitir evento de estoque reservado
      await this.eventBusService.emit({
        eventName: 'estoque.reservado',
        payload: {
          pedidoId: event.payload.pedidoId,
          timestamp: new Date()
        },
        timestamp: new Date(),
        aggregateId: event.payload.pedidoId
      });

    } catch (error) {
      console.error('Erro ao reservar estoque:', error);
      
      // Emitir evento de erro na reserva
      await this.eventBusService.emit({
        eventName: 'estoque.erro_reserva',
        payload: {
          pedidoId: event.payload.pedidoId,
          erro: error.message
        },
        timestamp: new Date(),
        aggregateId: event.payload.pedidoId
      });
    }
  }

  /**
   * Handler REAL: Libera estoque quando pagamento é recusado
   */
  @OnEvent('pagamento.recusado')
  async handlePagamentoRecusado(event: any): Promise<void> {
    try {
      console.log('📦 Liberando estoque para pagamento recusado:', {
        pedidoId: event.payload.pedidoId,
        motivo: event.payload.motivo
      });

      await this.liberarEstoque(event.payload.pedidoId);

      // Emitir evento de estoque liberado
      await this.eventBusService.emit({
        eventName: 'estoque.liberado',
        payload: {
          pedidoId: event.payload.pedidoId,
          motivo: 'Pagamento recusado'
        },
        timestamp: new Date(),
        aggregateId: event.payload.pedidoId
      });

    } catch (error) {
      console.error('Erro ao liberar estoque:', error);
    }
  }

  /**
   * Handler REAL: Libera estoque quando pagamento é estornado
   */
  @OnEvent('pagamento.estornado')
  async handlePagamentoEstornado(event: any): Promise<void> {
    try {
      console.log('📦 Liberando estoque para pagamento estornado:', {
        pedidoId: event.payload.pedidoId
      });

      await this.liberarEstoque(event.payload.pedidoId);

      // Emitir evento de estoque liberado
      await this.eventBusService.emit({
        eventName: 'estoque.liberado',
        payload: {
          pedidoId: event.payload.pedidoId,
          motivo: 'Pagamento estornado'
        },
        timestamp: new Date(),
        aggregateId: event.payload.pedidoId
      });

    } catch (error) {
      console.error('Erro ao liberar estoque:', error);
    }
  }
  /**
   * Reserva estoque para um pedido
   * @param pedidoId - ID do pedido
   */
  async reservarEstoque(pedidoId: string): Promise<void> {
    const pedido = await this.pedidoRepository.findOne({ 
      where: { id: pedidoId },
      relations: ['itens']
    });
    
    if (!pedido) {
      throw new Error(`Pedido ${pedidoId} não encontrado`);
    }

    // Verificar e reservar estoque para cada item
    for (const item of pedido.itens) {
      const produto = await this.produtoRepository.findOne({ 
        where: { id: item.produtoId }
      });
      
      if (!produto) {
        throw new Error(`Produto ${item.produtoId} não encontrado`);
      }

      if (!produto.temEstoqueSuficiente(item.quantidade)) {
        throw new Error(`Estoque insuficiente para produto ${produto.nome}. Disponível: ${produto.estoque}, solicitado: ${item.quantidade}`);
      }

      // Reduzir estoque
      produto.reduzirEstoque(item.quantidade);
      await this.produtoRepository.save(produto);
    }
  }
  /**
   * Libera estoque de um pedido (em caso de cancelamento/falha)
   * @param pedidoId - ID do pedido
   */
  async liberarEstoque(pedidoId: string): Promise<void> {
    const pedido = await this.pedidoRepository.findOne({ 
      where: { id: pedidoId },
      relations: ['itens']
    });
    
    if (!pedido) {
      throw new Error(`Pedido ${pedidoId} não encontrado`);
    }

    // Liberar estoque para cada item
    for (const item of pedido.itens) {
      const produto = await this.produtoRepository.findOne({ 
        where: { id: item.produtoId }
      });
      
      if (!produto) {
        console.error(`Produto ${item.produtoId} não encontrado para liberação de estoque`);
        continue;
      }

      // Adicionar estoque de volta
      produto.aumentarEstoque(item.quantidade);
      await this.produtoRepository.save(produto);
    }
  }
  /**
   * Verifica disponibilidade de estoque para um pedido
   * @param pedidoId - ID do pedido
   * @returns true se há estoque suficiente
   */
  async verificarDisponibilidadeEstoque(pedidoId: string): Promise<boolean> {
    const pedido = await this.pedidoRepository.findOne({ 
      where: { id: pedidoId },
      relations: ['itens']
    });
    
    if (!pedido) {
      return false;
    }

    for (const item of pedido.itens) {
      const produto = await this.produtoRepository.findOne({ 
        where: { id: item.produtoId }
      });
      
      if (!produto || !produto.temEstoqueSuficiente(item.quantidade)) {
        return false;
      }
    }

    return true;
  }
}
