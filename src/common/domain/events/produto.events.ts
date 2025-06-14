import { DomainEvent } from './domain-event.base';

/**
 * Evento disparado quando um produto é criado
 */
export class ProdutoCriadoEvent extends DomainEvent {
  public readonly eventName = 'produto.criado';
  public readonly version = 1;

  constructor(
    public readonly produtoId: string,
    public readonly nome: string,
    public readonly preco: number,
    public readonly estabelecimentoId: string,
    public readonly criadoPor: string
  ) {
    super();
  }

  protected getData(): object {
    return {
      produtoId: this.produtoId,
      nome: this.nome,
      preco: this.preco,
      estabelecimentoId: this.estabelecimentoId,
      criadoPor: this.criadoPor
    };
  }
}

/**
 * Evento disparado quando estoque de um produto é atualizado
 */
export class EstoqueAtualizadoEvent extends DomainEvent {
  public readonly eventName = 'produto.estoque.atualizado';
  public readonly version = 1;

  constructor(
    public readonly produtoId: string,
    public readonly estoqueAnterior: number,
    public readonly novoEstoque: number,
    public readonly motivo: string
  ) {
    super();
  }

  protected getData(): object {
    return {
      produtoId: this.produtoId,
      estoqueAnterior: this.estoqueAnterior,
      novoEstoque: this.novoEstoque,
      motivo: this.motivo
    };
  }
}

/**
 * Evento disparado quando um produto é ativado/desativado
 */
export class ProdutoStatusAlteradoEvent extends DomainEvent {
  public readonly eventName = 'produto.status.alterado';
  public readonly version = 1;

  constructor(
    public readonly produtoId: string,
    public readonly statusAnterior: boolean,
    public readonly novoStatus: boolean,
    public readonly alteradoPor?: string
  ) {
    super();
  }

  protected getData(): object {
    return {
      produtoId: this.produtoId,
      statusAnterior: this.statusAnterior,
      novoStatus: this.novoStatus,
      alteradoPor: this.alteradoPor
    };
  }
}
