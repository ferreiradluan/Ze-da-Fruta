import { Specification, CompositeSpecification, AndSpecification, OrSpecification, NotSpecification } from '../../../common/domain/specifications/specification.base';
import { Pedido, TipoPedido, FormaPagamento } from '../entities/pedido.entity';
import { StatusPedido } from '../enums/status-pedido.enum';

/**
 * Base specification for orders
 */
export abstract class PedidoSpecification extends Specification<Pedido> {}

/**
 * Specification to check if order is pending
 */
export class PedidoPendenteSpecification extends PedidoSpecification {
  isSatisfiedBy(pedido: Pedido): boolean {
    return pedido.status === StatusPedido.PENDENTE;
  }

  toString(): string {
    return 'Order is pending';
  }
}

/**
 * Specification to check if order is confirmed
 */
export class PedidoConfirmadoSpecification extends PedidoSpecification {
  isSatisfiedBy(pedido: Pedido): boolean {
    return pedido.status === StatusPedido.CONFIRMADO;
  }

  toString(): string {
    return 'Order is confirmed';
  }
}

/**
 * Specification to check if order can be edited
 */
export class PedidoPodeSerEditadoSpecification extends PedidoSpecification {
  isSatisfiedBy(pedido: Pedido): boolean {
    return pedido.status === StatusPedido.PENDENTE || pedido.status === StatusPedido.CONFIRMADO;
  }

  toString(): string {
    return 'Order can be edited (pending or confirmed)';
  }
}

/**
 * Specification to check if order can be cancelled
 */
export class PedidoPodeSerCanceladoSpecification extends PedidoSpecification {
  isSatisfiedBy(pedido: Pedido): boolean {
    return [StatusPedido.PENDENTE, StatusPedido.CONFIRMADO, StatusPedido.PREPARANDO].includes(pedido.status);
  }

  toString(): string {
    return 'Order can be cancelled';
  }
}

/**
 * Specification to check if order is delivery type
 */
export class PedidoDeliverySpecification extends PedidoSpecification {
  isSatisfiedBy(pedido: Pedido): boolean {
    return pedido.tipo === TipoPedido.DELIVERY;
  }

  toString(): string {
    return 'Order is delivery type';
  }
}

/**
 * Specification to check if order has minimum value
 */
export class PedidoValorMinimoSpecification extends PedidoSpecification {
  constructor(private valorMinimo: number) {
    super();
  }

  isSatisfiedBy(pedido: Pedido): boolean {
    return pedido.valorTotal >= this.valorMinimo;
  }

  toString(): string {
    return `Order has minimum value of ${this.valorMinimo}`;
  }
}

/**
 * Specification to check if order has items
 */
export class PedidoTemItensSpecification extends PedidoSpecification {
  isSatisfiedBy(pedido: Pedido): boolean {
    return pedido.itens && pedido.itens.length > 0;
  }

  toString(): string {
    return 'Order has items';
  }
}

/**
 * Specification to check if order belongs to specific customer
 */
export class PedidoClienteSpecification extends PedidoSpecification {
  constructor(private clienteId: string) {
    super();
  }

  isSatisfiedBy(pedido: Pedido): boolean {
    return pedido.clienteId === this.clienteId;
  }

  toString(): string {
    return `Order belongs to customer ${this.clienteId}`;
  }
}

/**
 * Specification to check if order is from specific establishment
 */
export class PedidoEstabelecimentoSpecification extends PedidoSpecification {
  constructor(private estabelecimentoId: string) {
    super();
  }

  isSatisfiedBy(pedido: Pedido): boolean {
    return pedido.estabelecimentoId === this.estabelecimentoId;
  }

  toString(): string {
    return `Order is from establishment ${this.estabelecimentoId}`;
  }
}

/**
 * Specification to check if order was created within time range
 */
export class PedidoCriadoEmPeriodoSpecification extends PedidoSpecification {
  constructor(
    private dataInicio: Date,
    private dataFim: Date
  ) {
    super();
  }

  isSatisfiedBy(pedido: Pedido): boolean {
    return pedido.createdAt >= this.dataInicio && pedido.createdAt <= this.dataFim;
  }

  toString(): string {
    return `Order was created between ${this.dataInicio.toISOString()} and ${this.dataFim.toISOString()}`;
  }
}

/**
 * Specification to check if order has coupon applied
 */
export class PedidoComCupomSpecification extends PedidoSpecification {
  isSatisfiedBy(pedido: Pedido): boolean {
    return pedido.cupom !== null && pedido.cupom !== undefined;
  }

  toString(): string {
    return 'Order has coupon applied';
  }
}

/**
 * Specification to check if order uses specific payment method
 */
export class PedidoFormaPagamentoSpecification extends PedidoSpecification {
  constructor(private formaPagamento: FormaPagamento) {
    super();
  }

  isSatisfiedBy(pedido: Pedido): boolean {
    return pedido.formaPagamento === this.formaPagamento;
  }

  toString(): string {
    return `Order uses payment method ${this.formaPagamento}`;
  }
}

/**
 * Specification to check if order is expired (pending too long)
 */
export class PedidoExpiradoSpecification extends PedidoSpecification {
  constructor(private minutosExpiracao: number = 30) {
    super();
  }

  isSatisfiedBy(pedido: Pedido): boolean {
    if (pedido.status !== StatusPedido.PENDENTE) {
      return false;
    }

    const agora = new Date();
    const diferencaMinutos = (agora.getTime() - pedido.createdAt.getTime()) / (1000 * 60);
    return diferencaMinutos > this.minutosExpiracao;
  }

  toString(): string {
    return `Order is expired (pending for more than ${this.minutosExpiracao} minutes)`;
  }
}

/**
 * Specification to check if order needs delivery assignment
 */
export class PedidoPrecisaEntregadorSpecification extends CompositeSpecification<Pedido> {
  constructor() {
    const isConfirmed = new PedidoConfirmadoSpecification();
    const isDelivery = new PedidoDeliverySpecification();
    
    super(new AndSpecification(isConfirmed, isDelivery));
  }

  isSatisfiedBy(pedido: Pedido): boolean {
    return super.isSatisfiedBy(pedido) && !pedido.entregadorId;
  }

  toString(): string {
    return 'Order needs delivery person assignment (confirmed delivery order without assigned delivery person)';
  }
}

/**
 * Specification to check if order is ready for preparation
 */
export class PedidoProntoParaPreparoSpecification extends CompositeSpecification<Pedido> {
  constructor() {
    const isConfirmed = new PedidoConfirmadoSpecification();
    const hasItems = new PedidoTemItensSpecification();
    
    super(new AndSpecification(isConfirmed, hasItems));
  }

  toString(): string {
    return 'Order is ready for preparation (confirmed and has items)';
  }
}

/**
 * Specification to check if order is valid for processing
 */
export class PedidoValidoParaProcessamentoSpecification extends CompositeSpecification<Pedido> {
  constructor(valorMinimo: number = 0) {
    const hasItems = new PedidoTemItensSpecification();
    const hasMinimumValue = new PedidoValorMinimoSpecification(valorMinimo);
    const isPending = new PedidoPendenteSpecification();
    
    super(new AndSpecification(
      new AndSpecification(hasItems, hasMinimumValue),
      isPending
    ));
  }

  toString(): string {
    return 'Order is valid for processing (pending, has items, and meets minimum value)';
  }
}

/**
 * Specification to check if delivery order has complete address
 */
export class PedidoDeliveryComEnderecoCompletoSpecification extends CompositeSpecification<Pedido> {
  constructor() {
    const isDelivery = new PedidoDeliverySpecification();
    super(isDelivery);
  }

  isSatisfiedBy(pedido: Pedido): boolean {
    if (!super.isSatisfiedBy(pedido)) {
      return false;
    }

    const endereco = pedido.enderecoEntrega;
    return endereco && 
           endereco.logradouro && 
           endereco.numero && 
           endereco.bairro && 
           endereco.cidade && 
           endereco.cep;
  }

  toString(): string {
    return 'Delivery order has complete address information';
  }
}

/**
 * Factory class to create common order specifications
 */
export class PedidoSpecificationFactory {
  static criarValidoParaProcessamento(valorMinimo: number = 0): PedidoValidoParaProcessamentoSpecification {
    return new PedidoValidoParaProcessamentoSpecification(valorMinimo);
  }

  static criarProntoParaPreparo(): PedidoProntoParaPreparoSpecification {
    return new PedidoProntoParaPreparoSpecification();
  }

  static criarPrecisaEntregador(): PedidoPrecisaEntregadorSpecification {
    return new PedidoPrecisaEntregadorSpecification();
  }

  static criarDeliveryComEnderecoCompleto(): PedidoDeliveryComEnderecoCompletoSpecification {
    return new PedidoDeliveryComEnderecoCompletoSpecification();
  }

  static criarPodeSerEditado(): PedidoPodeSerEditadoSpecification {
    return new PedidoPodeSerEditadoSpecification();
  }

  static criarPodeSerCancelado(): PedidoPodeSerCanceladoSpecification {
    return new PedidoPodeSerCanceladoSpecification();
  }

  static criarExpirado(minutosExpiracao: number = 30): PedidoExpiradoSpecification {
    return new PedidoExpiradoSpecification(minutosExpiracao);
  }

  static criarPorCliente(clienteId: string): PedidoClienteSpecification {
    return new PedidoClienteSpecification(clienteId);
  }

  static criarPorEstabelecimento(estabelecimentoId: string): PedidoEstabelecimentoSpecification {
    return new PedidoEstabelecimentoSpecification(estabelecimentoId);
  }

  static criarComValorMinimo(valorMinimo: number): PedidoValorMinimoSpecification {
    return new PedidoValorMinimoSpecification(valorMinimo);
  }
}
