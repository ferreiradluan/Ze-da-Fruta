import { DomainEvent } from '../../../common/domain/events/domain-event.base';

export class CategoriaCriadaEvent extends DomainEvent {
  constructor(
    public readonly categoriaId: string,
    public readonly nome: string,
    public readonly estabelecimentoId?: string
  ) {
    super();
  }
}

export class CategoriaDesativadaEvent extends DomainEvent {
  constructor(
    public readonly categoriaId: string,
    public readonly nome: string,
    public readonly motivo?: string
  ) {
    super();
  }
}

export class CategoriaAtualizadaEvent extends DomainEvent {
  constructor(
    public readonly categoriaId: string,
    public readonly camposAlterados: string[],
    public readonly dadosAnteriores: any,
    public readonly dadosNovos: any
  ) {
    super();
  }
}

export class CategoriaProdutoAdicionadoEvent extends DomainEvent {
  constructor(
    public readonly categoriaId: string,
    public readonly produtoId: string,
    public readonly nomeProduto: string
  ) {
    super();
  }
}

export class CategoriaProdutoRemovidoEvent extends DomainEvent {
  constructor(
    public readonly categoriaId: string,
    public readonly produtoId: string,
    public readonly nomeProduto: string
  ) {
    super();
  }
}
