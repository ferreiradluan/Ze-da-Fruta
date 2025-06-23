import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

/**
 * Interface para eventos de domínio
 */
export interface DomainEvent {
  eventName: string;
  payload: any;
  timestamp: Date;
  aggregateId?: string;
}

/**
 * Eventos de Pedido
 */
export interface PedidoCriadoEvent extends DomainEvent {
  eventName: 'pedido.criado';
  payload: {
    pedidoId: string;
    usuarioId: string;
    valor: number;
    itens: Array<{
      produtoId: string;
      quantidade: number;
      preco: number;
    }>;
  };
}

export interface PedidoCanceladoEvent extends DomainEvent {
  eventName: 'pedido.cancelado';
  payload: {
    pedidoId: string;
    motivo: string;
  };
}

/**
 * Eventos de Pagamento
 */
export interface PagamentoProcessadoEvent extends DomainEvent {
  eventName: 'pagamento.processado';
  payload: {
    pedidoId: string;
    pagamentoId: string;
    status: 'aprovado' | 'recusado' | 'estornado';
    valor: number;
  };
}

/**
 * Serviço Event Bus para comunicação entre domínios
 * 
 * Este serviço fornece uma interface simplificada para emitir
 * e escutar eventos de domínio na aplicação.
 */
@Injectable()
export class EventBusService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Emite um evento de domínio
   * 
   * @param event - Evento a ser emitido
   */
  async emit(event: DomainEvent): Promise<void> {
    try {
      // Adiciona timestamp se não existir
      if (!event.timestamp) {
        event.timestamp = new Date();
      }

      // Emite o evento
      this.eventEmitter.emit(event.eventName, event);
      
      console.log(`🎯 Evento emitido: ${event.eventName}`, {
        aggregateId: event.aggregateId,
        timestamp: event.timestamp,
      });
    } catch (error) {
      console.error(`❌ Erro ao emitir evento ${event.eventName}:`, error);
      throw error;
    }
  }

  /**
   * Emite um evento de pedido criado
   */
  async emitPedidoCriado(event: Omit<PedidoCriadoEvent, 'eventName' | 'timestamp'>): Promise<void> {
    await this.emit({
      ...event,
      eventName: 'pedido.criado',
      timestamp: new Date(),
    });
  }

  /**
   * Emite um evento de pedido cancelado
   */
  async emitPedidoCancelado(event: Omit<PedidoCanceladoEvent, 'eventName' | 'timestamp'>): Promise<void> {
    await this.emit({
      ...event,
      eventName: 'pedido.cancelado',
      timestamp: new Date(),
    });
  }

  /**
   * Emite um evento de pagamento processado
   */
  async emitPagamentoProcessado(event: Omit<PagamentoProcessadoEvent, 'eventName' | 'timestamp'>): Promise<void> {
    await this.emit({
      ...event,
      eventName: 'pagamento.processado',
      timestamp: new Date(),
    });
  }

  /**
   * Publicar um evento no sistema
   */
  publish(eventName: string, payload: any): void {
    const event: DomainEvent = {
      eventName,
      payload,
      timestamp: new Date(),
    };
    
    console.log(`Event published: ${eventName}`, event);
    this.eventEmitter.emit(eventName, event);
  }

  /**
   * 🔧 ORQUESTRAÇÃO: Evento pedido criado
   */
  @OnEvent('pedido.criado')
  handlePedidoCriadoEvent(event: PedidoCriadoEvent) {
    // Lógica para orquestrar o que acontece quando um pedido é criado
    console.log('Orquestrando evento de pedido criado:', event);
  }

  /**
   * 🔧 ORQUESTRAÇÃO: Evento pedido cancelado
   */
  @OnEvent('pedido.cancelado')
  handlePedidoCanceladoEvent(event: PedidoCanceladoEvent) {
    // Lógica para orquestrar o que acontece quando um pedido é cancelado
    console.log('Orquestrando evento de pedido cancelado:', event);
  }

  /**
   * 🔧 ORQUESTRAÇÃO: Evento pagamento processado
   */
  @OnEvent('pagamento.processado')
  handlePagamentoProcessadoEvent(event: PagamentoProcessadoEvent) {
    // Lógica para orquestrar o que acontece quando um pagamento é processado
    console.log('Orquestrando evento de pagamento processado:', event);
  }
  // Os handlers reais serão implementados nos módulos específicos
  // Este serviço foca apenas na emissão de eventos
}
