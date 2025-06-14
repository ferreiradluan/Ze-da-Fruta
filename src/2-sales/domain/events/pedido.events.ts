import { DomainEvent } from '../../../common/domain/events/domain-event';

/**
 * Evento disparado quando um pedido é criado
 */
export class PedidoCriadoEvent extends DomainEvent {
  readonly eventName = 'pedido.criado';

  constructor(
    public readonly aggregateId: string, // pedidoId
    public readonly clienteId: string,
    public readonly valorTotal: number,
    public readonly quantidadeItens: number,
    public readonly estabelecimentoId?: string
  ) {
    super();
  }

  protected getData(): Record<string, any> {
    return {
      clienteId: this.clienteId,
      valorTotal: this.valorTotal,
      quantidadeItens: this.quantidadeItens,
      estabelecimentoId: this.estabelecimentoId
    };
  }
}

/**
 * Evento disparado quando um pedido é confirmado/pago
 */
export class PedidoConfirmadoEvent extends DomainEvent {
  readonly eventName = 'pedido.confirmado';

  constructor(
    public readonly aggregateId: string, // pedidoId
    public readonly clienteId: string,
    public readonly valorTotal: number,
    public readonly enderecoEntrega?: string
  ) {
    super();
  }

  protected getData(): Record<string, any> {
    return {
      clienteId: this.clienteId,
      valorTotal: this.valorTotal,
      enderecoEntrega: this.enderecoEntrega
    };
  }
}

/**
 * Evento disparado quando um pedido é cancelado
 */
export class PedidoCanceladoEvent extends DomainEvent {
  readonly eventName = 'pedido.cancelado';

  constructor(
    public readonly aggregateId: string, // pedidoId
    public readonly clienteId: string,
    public readonly motivo?: string
  ) {
    super();
  }

  protected getData(): Record<string, any> {
    return {
      clienteId: this.clienteId,
      motivo: this.motivo
    };
  }
}

/**
 * Evento disparado quando o status de um pedido é atualizado
 */
export class PedidoStatusAtualizadoEvent extends DomainEvent {
  readonly eventName = 'pedido.status-atualizado';

  constructor(
    public readonly aggregateId: string, // pedidoId
    public readonly statusAnterior: string,
    public readonly novoStatus: string,
    public readonly clienteId: string
  ) {
    super();
  }

  protected getData(): Record<string, any> {
    return {
      statusAnterior: this.statusAnterior,
      novoStatus: this.novoStatus,
      clienteId: this.clienteId
    };
  }
}
