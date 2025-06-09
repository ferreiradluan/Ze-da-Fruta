import { DomainEvent } from '../../../common/domain/events/domain-event.base';

export class ProdutoEstoqueAlteradoEvent extends DomainEvent {
  constructor(
    public readonly produtoId: string,
    public readonly estoqueAnterior: number,
    public readonly estoqueAtual: number,
    public readonly motivo: string,
    public readonly usuarioId?: string
  ) {
    super(produtoId);
  }

  getEventName(): string {
    return 'ProdutoEstoqueAlterado';
  }

  protected getPayload(): Record<string, any> {
    return {
      produtoId: this.produtoId,
      estoqueAnterior: this.estoqueAnterior,
      estoqueAtual: this.estoqueAtual,
      motivo: this.motivo,
      usuarioId: this.usuarioId,
      diferenca: this.estoqueAtual - this.estoqueAnterior
    };
  }

  ehReducaoEstoque(): boolean {
    return this.estoqueAtual < this.estoqueAnterior;
  }

  ehReposicaoEstoque(): boolean {
    return this.estoqueAtual > this.estoqueAnterior;
  }
}

export class ProdutoEstoqueCriticoEvent extends DomainEvent {
  constructor(
    public readonly produtoId: string,
    public readonly nomeProduto: string,
    public readonly estoqueAtual: number,
    public readonly estoqueMinimo: number,
    public readonly estabelecimentoId: string
  ) {
    super(produtoId);
  }

  getEventName(): string {
    return 'ProdutoEstoqueCritico';
  }

  protected getPayload(): Record<string, any> {
    return {
      produtoId: this.produtoId,
      nomeProduto: this.nomeProduto,
      estoqueAtual: this.estoqueAtual,
      estoqueMinimo: this.estoqueMinimo,
      estabelecimentoId: this.estabelecimentoId,
      nivelCriticidade: this.calcularNivelCriticidade()
    };
  }

  private calcularNivelCriticidade(): 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO' {
    const percentual = (this.estoqueAtual / this.estoqueMinimo) * 100;
    
    if (percentual <= 0) return 'CRITICO';
    if (percentual <= 25) return 'ALTO';
    if (percentual <= 50) return 'MEDIO';
    return 'BAIXO';
  }
}

export class ProdutoPrecoAlteradoEvent extends DomainEvent {
  constructor(
    public readonly produtoId: string,
    public readonly precoAnterior: number,
    public readonly precoNovo: number,
    public readonly usuarioId: string,
    public readonly motivo?: string
  ) {
    super(produtoId);
  }

  getEventName(): string {
    return 'ProdutoPrecoAlterado';
  }

  protected getPayload(): Record<string, any> {
    return {
      produtoId: this.produtoId,
      precoAnterior: this.precoAnterior,
      precoNovo: this.precoNovo,
      usuarioId: this.usuarioId,
      motivo: this.motivo,
      percentualAlteracao: this.calcularPercentualAlteracao()
    };
  }

  private calcularPercentualAlteracao(): number {
    return ((this.precoNovo - this.precoAnterior) / this.precoAnterior) * 100;
  }

  ehAumento(): boolean {
    return this.precoNovo > this.precoAnterior;
  }

  ehReducao(): boolean {
    return this.precoNovo < this.precoAnterior;
  }
}

export class ProdutoCriadoEvent extends DomainEvent {
  constructor(
    public readonly produtoId: string,
    public readonly nomeProduto: string,
    public readonly preco: number,
    public readonly estabelecimentoId: string,
    public readonly categorias: string[],
    public readonly criadoPor: string
  ) {
    super(produtoId);
  }

  getEventName(): string {
    return 'ProdutoCriado';
  }

  protected getPayload(): Record<string, any> {
    return {
      produtoId: this.produtoId,
      nomeProduto: this.nomeProduto,
      preco: this.preco,
      estabelecimentoId: this.estabelecimentoId,
      categorias: this.categorias,
      criadoPor: this.criadoPor
    };
  }
}

export class ProdutoDesativadoEvent extends DomainEvent {
  constructor(
    public readonly produtoId: string,
    public readonly nomeProduto: string,
    public readonly estabelecimentoId: string,
    public readonly motivo: string,
    public readonly desativadoPor: string
  ) {
    super(produtoId);
  }

  getEventName(): string {
    return 'ProdutoDesativado';
  }

  protected getPayload(): Record<string, any> {
    return {
      produtoId: this.produtoId,
      nomeProduto: this.nomeProduto,
      estabelecimentoId: this.estabelecimentoId,
      motivo: this.motivo,
      desativadoPor: this.desativadoPor
    };
  }
}
