import { DomainEvent } from '../../../common/domain/events/domain-event';

/**
 * Evento disparado quando um produto é criado
 */
export class ProdutoCriadoEvent extends DomainEvent {
  readonly eventName = 'produto.criado';

  constructor(
    public readonly aggregateId: string, // produtoId
    public readonly nome: string,
    public readonly preco: number,
    public readonly estabelecimentoId?: string
  ) {
    super();
  }

  protected getData(): Record<string, any> {
    return {
      nome: this.nome,
      preco: this.preco,
      estabelecimentoId: this.estabelecimentoId
    };
  }
}

/**
 * Evento disparado quando o estoque de um produto é atualizado
 */
export class ProdutoEstoqueAtualizadoEvent extends DomainEvent {
  readonly eventName = 'produto.estoque-atualizado';

  constructor(
    public readonly aggregateId: string, // produtoId
    public readonly estoqueAnterior: number,
    public readonly novoEstoque: number,
    public readonly motivo: 'venda' | 'reposicao' | 'ajuste' | 'reserva' | 'liberacao'
  ) {
    super();
  }

  protected getData(): Record<string, any> {
    return {
      estoqueAnterior: this.estoqueAnterior,
      novoEstoque: this.novoEstoque,
      motivo: this.motivo
    };
  }
}

/**
 * Evento disparado quando um produto é ativado/desativado
 */
export class ProdutoStatusAtualizadoEvent extends DomainEvent {
  readonly eventName = 'produto.status-atualizado';

  constructor(
    public readonly aggregateId: string, // produtoId
    public readonly ativo: boolean
  ) {
    super();
  }

  protected getData(): Record<string, any> {
    return {
      ativo: this.ativo
    };
  }
}
