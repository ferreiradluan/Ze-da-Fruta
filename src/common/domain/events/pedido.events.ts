import { DomainEvent } from './domain-event.base';

/**
 * Evento disparado quando um pedido é criado
 */
export class PedidoCriadoEvent extends DomainEvent {
  public readonly eventName = 'pedido.criado';
  public readonly version = 1;

  constructor(
    public readonly pedidoId: string,
    public readonly clienteId: string,
    public readonly estabelecimentoId: string,
    public readonly valorTotal: number,
    public readonly itens: Array<{
      produtoId: string;
      nomeProduto: string;
      quantidade: number;
      precoUnitario: number;
    }>
  ) {
    super();
  }

  protected getData(): object {
    return {
      pedidoId: this.pedidoId,
      clienteId: this.clienteId,
      estabelecimentoId: this.estabelecimentoId,
      valorTotal: this.valorTotal,
      itens: this.itens
    };
  }
}

/**
 * Evento disparado quando um pedido é confirmado (pago)
 */
export class PedidoConfirmadoEvent extends DomainEvent {
  public readonly eventName = 'pedido.confirmado';
  public readonly version = 1;

  constructor(
    public readonly pedidoId: string,
    public readonly clienteId: string,
    public readonly estabelecimentoId: string,
    public readonly enderecoEntrega: string,
    public readonly valorTotal: number
  ) {
    super();
  }

  protected getData(): object {
    return {
      pedidoId: this.pedidoId,
      clienteId: this.clienteId,
      estabelecimentoId: this.estabelecimentoId,
      enderecoEntrega: this.enderecoEntrega,
      valorTotal: this.valorTotal
    };
  }
}

/**
 * Evento disparado quando um pedido é cancelado
 */
export class PedidoCanceladoEvent extends DomainEvent {
  public readonly eventName = 'pedido.cancelado';
  public readonly version = 1;

  constructor(
    public readonly pedidoId: string,
    public readonly clienteId: string,
    public readonly motivo?: string
  ) {
    super();
  }

  protected getData(): object {
    return {
      pedidoId: this.pedidoId,
      clienteId: this.clienteId,
      motivo: this.motivo
    };
  }
}

/**
 * Evento disparado quando o status de um pedido é atualizado
 */
export class PedidoStatusAtualizadoEvent extends DomainEvent {
  public readonly eventName = 'pedido.status.atualizado';
  public readonly version = 1;

  constructor(
    public readonly pedidoId: string,
    public readonly statusAnterior: string,
    public readonly novoStatus: string,
    public readonly atualizadoPor?: string
  ) {
    super();
  }

  protected getData(): object {
    return {
      pedidoId: this.pedidoId,
      statusAnterior: this.statusAnterior,
      novoStatus: this.novoStatus,
      atualizadoPor: this.atualizadoPor
    };
  }
}

/**
 * Evento disparado quando um cupom é aplicado ao pedido
 */
export class CupomAplicadoEvent extends DomainEvent {
  public readonly eventName = 'pedido.cupom.aplicado';
  public readonly version = 1;

  constructor(
    public readonly pedidoId: string,
    public readonly cupomId: string,
    public readonly codigoCupom: string,
    public readonly valorDesconto: number
  ) {
    super();
  }

  protected getData(): object {
    return {
      pedidoId: this.pedidoId,
      cupomId: this.cupomId,
      codigoCupom: this.codigoCupom,
      valorDesconto: this.valorDesconto
    };
  }
}
