import { DomainEvent } from '../../../common/domain/events/domain-event.base';

export class ItemPedidoCriadoEvent extends DomainEvent {
  constructor(
    public readonly itemId: string,
    public readonly pedidoId: string,
    public readonly produtoId: string,
    public readonly nomeProduto: string,
    public readonly quantidade: number,
    public readonly precoUnitario: number,
    public readonly subtotal: number
  ) {
    super();
  }
}

export class ItemPedidoQuantidadeAlteradaEvent extends DomainEvent {
  constructor(
    public readonly itemId: string,
    public readonly pedidoId: string,
    public readonly produtoId: string,
    public readonly quantidadeAnterior: number,
    public readonly novaQuantidade: number,
    public readonly novoSubtotal: number
  ) {
    super();
  }
}

export class ItemPedidoRemovidoEvent extends DomainEvent {
  constructor(
    public readonly itemId: string,
    public readonly pedidoId: string,
    public readonly produtoId: string,
    public readonly nomeProduto: string,
    public readonly quantidade: number,
    public readonly subtotal: number
  ) {
    super();
  }
}

export class ItemPedidoPrecoAtualizadoEvent extends DomainEvent {
  constructor(
    public readonly itemId: string,
    public readonly pedidoId: string,
    public readonly produtoId: string,
    public readonly precoAnterior: number,
    public readonly novoPreco: number,
    public readonly novoSubtotal: number
  ) {
    super();
  }
}

export class ItemPedidoDescontoAplicadoEvent extends DomainEvent {
  constructor(
    public readonly itemId: string,
    public readonly pedidoId: string,
    public readonly produtoId: string,
    public readonly valorDesconto: number,
    public readonly subtotalAnterior: number,
    public readonly novoSubtotal: number,
    public readonly motivo?: string
  ) {
    super();
  }
}

export class ItemPedidoPersonalizadoEvent extends DomainEvent {
  constructor(
    public readonly itemId: string,
    public readonly pedidoId: string,
    public readonly produtoId: string,
    public readonly personalizacoes: any[],
    public readonly valorAdicional: number
  ) {
    super();
  }
}

export class ItemPedidoObservacaoAdicionadaEvent extends DomainEvent {
  constructor(
    public readonly itemId: string,
    public readonly pedidoId: string,
    public readonly produtoId: string,
    public readonly observacao: string
  ) {
    super();
  }
}
