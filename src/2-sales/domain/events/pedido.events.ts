import { DomainEvent } from '../../../common/domain/events/domain-event.base';

export class PedidoCriadoEvent extends DomainEvent {
  constructor(
    public readonly pedidoId: string,
    public readonly clienteId: string,
    public readonly valorTotal: number,
    public readonly itens: Array<{
      produtoId: string;
      nomeProduto: string;
      quantidade: number;
      precoUnitario: number;
    }>
  ) {
    super(pedidoId);
  }

  getEventName(): string {
    return 'PedidoCriado';
  }

  protected getPayload(): Record<string, any> {
    return {
      pedidoId: this.pedidoId,
      clienteId: this.clienteId,
      valorTotal: this.valorTotal,
      itens: this.itens,
      quantidadeItens: this.itens.length,
      produtosEnvolvidos: this.itens.map(item => item.produtoId)
    };
  }
}

export class PedidoConfirmadoEvent extends DomainEvent {
  constructor(
    public readonly pedidoId: string,
    public readonly clienteId: string,
    public readonly valorTotal: number,
    public readonly cupomUtilizado?: string
  ) {
    super(pedidoId);
  }

  getEventName(): string {
    return 'PedidoConfirmado';
  }

  protected getPayload(): Record<string, any> {
    return {
      pedidoId: this.pedidoId,
      clienteId: this.clienteId,
      valorTotal: this.valorTotal,
      cupomUtilizado: this.cupomUtilizado,
      dataConfirmacao: this.occurredOn.toISOString()
    };
  }
}

export class PedidoCanceladoEvent extends DomainEvent {
  constructor(
    public readonly pedidoId: string,
    public readonly clienteId: string,
    public readonly motivo: string,
    public readonly valorTotal: number,
    public readonly itensParaReposicao: Array<{
      produtoId: string;
      quantidade: number;
    }>
  ) {
    super(pedidoId);
  }

  getEventName(): string {
    return 'PedidoCancelado';
  }

  protected getPayload(): Record<string, any> {
    return {
      pedidoId: this.pedidoId,
      clienteId: this.clienteId,
      motivo: this.motivo,
      valorTotal: this.valorTotal,
      itensParaReposicao: this.itensParaReposicao,
      dataCancelamento: this.occurredOn.toISOString()
    };
  }
}

export class PedidoEntregueEvent extends DomainEvent {
  constructor(
    public readonly pedidoId: string,
    public readonly clienteId: string,
    public readonly entregadorId: string,
    public readonly enderecoEntrega: string,
    public readonly tempoEntrega: number // em minutos
  ) {
    super(pedidoId);
  }

  getEventName(): string {
    return 'PedidoEntregue';
  }

  protected getPayload(): Record<string, any> {
    return {
      pedidoId: this.pedidoId,
      clienteId: this.clienteId,
      entregadorId: this.entregadorId,
      enderecoEntrega: this.enderecoEntrega,
      tempoEntrega: this.tempoEntrega,
      dataEntrega: this.occurredOn.toISOString()
    };
  }
}

export class PedidoItemAdicionadoEvent extends DomainEvent {
  constructor(
    public readonly pedidoId: string,
    public readonly produtoId: string,
    public readonly nomeProduto: string,
    public readonly quantidade: number,
    public readonly precoUnitario: number,
    public readonly novoValorTotal: number
  ) {
    super(pedidoId);
  }

  getEventName(): string {
    return 'PedidoItemAdicionado';
  }

  protected getPayload(): Record<string, any> {
    return {
      pedidoId: this.pedidoId,
      produtoId: this.produtoId,
      nomeProduto: this.nomeProduto,
      quantidade: this.quantidade,
      precoUnitario: this.precoUnitario,
      subtotal: this.quantidade * this.precoUnitario,
      novoValorTotal: this.novoValorTotal
    };
  }
}

export class PedidoItemRemovidoEvent extends DomainEvent {
  constructor(
    public readonly pedidoId: string,
    public readonly produtoId: string,
    public readonly nomeProduto: string,
    public readonly quantidadeRemovida: number,
    public readonly novoValorTotal: number
  ) {
    super(pedidoId);
  }

  getEventName(): string {
    return 'PedidoItemRemovido';
  }

  protected getPayload(): Record<string, any> {
    return {
      pedidoId: this.pedidoId,
      produtoId: this.produtoId,
      nomeProduto: this.nomeProduto,
      quantidadeRemovida: this.quantidadeRemovida,
      novoValorTotal: this.novoValorTotal
    };
  }
}

export class CupomAplicadoEvent extends DomainEvent {
  constructor(
    public readonly pedidoId: string,
    public readonly cupomCodigo: string,
    public readonly valorDesconto: number,
    public readonly valorOriginal: number,
    public readonly valorFinal: number
  ) {
    super(pedidoId);
  }

  getEventName(): string {
    return 'CupomAplicado';
  }

  protected getPayload(): Record<string, any> {
    return {
      pedidoId: this.pedidoId,
      cupomCodigo: this.cupomCodigo,
      valorDesconto: this.valorDesconto,
      valorOriginal: this.valorOriginal,
      valorFinal: this.valorFinal,
      percentualDesconto: (this.valorDesconto / this.valorOriginal) * 100
    };
  }
}

export class ItemAdicionadoEvent extends DomainEvent {
  constructor(
    public readonly pedidoId: string,
    public readonly produtoId: string,
    public readonly nomeProduto: string,
    public readonly quantidade: number,
    public readonly precoUnitario: number
  ) {
    super(pedidoId);
  }

  getEventName(): string {
    return 'ItemAdicionado';
  }

  protected getPayload(): Record<string, any> {
    return {
      pedidoId: this.pedidoId,
      produtoId: this.produtoId,
      nomeProduto: this.nomeProduto,
      quantidade: this.quantidade,
      precoUnitario: this.precoUnitario,
      subtotal: this.quantidade * this.precoUnitario
    };
  }
}

export class ItemRemovidoEvent extends DomainEvent {
  constructor(
    public readonly pedidoId: string,
    public readonly produtoId: string,
    public readonly nomeProduto: string,
    public readonly quantidade: number
  ) {
    super(pedidoId);
  }

  getEventName(): string {
    return 'ItemRemovido';
  }

  protected getPayload(): Record<string, any> {
    return {
      pedidoId: this.pedidoId,
      produtoId: this.produtoId,
      nomeProduto: this.nomeProduto,
      quantidade: this.quantidade
    };
  }
}
