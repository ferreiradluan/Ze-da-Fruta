import { DomainEvent } from '../../../common/domain/events/domain-event.base';

export class EstabelecimentoCriadoEvent extends DomainEvent {
  constructor(
    public readonly estabelecimentoId: string,
    public readonly nome: string,
    public readonly cnpj: string,
    public readonly tipo: string,
    public readonly responsavelId?: string
  ) {
    super();
  }
}

export class EstabelecimentoAtualizadoEvent extends DomainEvent {
  constructor(
    public readonly estabelecimentoId: string,
    public readonly camposAlterados: string[],
    public readonly dadosAnteriores: any,
    public readonly dadosNovos: any
  ) {
    super();
  }
}

export class EstabelecimentoAbertoEvent extends DomainEvent {
  constructor(
    public readonly estabelecimentoId: string,
    public readonly nome: string,
    public readonly horarioAbertura: string
  ) {
    super();
  }
}

export class EstabelecimentoFechadoEvent extends DomainEvent {
  constructor(
    public readonly estabelecimentoId: string,
    public readonly nome: string,
    public readonly horarioFechamento: string
  ) {
    super();
  }
}

export class EstabelecimentoDesativadoEvent extends DomainEvent {
  constructor(
    public readonly estabelecimentoId: string,
    public readonly nome: string,
    public readonly motivo: string,
    public readonly responsavelId?: string
  ) {
    super();
  }
}

export class EstabelecimentoLocalizacaoAtualizadaEvent extends DomainEvent {
  constructor(
    public readonly estabelecimentoId: string,
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly endereco: string
  ) {
    super();
  }
}

export class EstabelecimentoAprovadoEvent extends DomainEvent {
  constructor(
    public readonly estabelecimentoId: string,
    public readonly nome: string,
    public readonly dataAprovacao: Date,
    public readonly aprovadoPor?: string
  ) {
    super();
  }
}

export class EstabelecimentoSuspensoEvent extends DomainEvent {
  constructor(
    public readonly estabelecimentoId: string,
    public readonly nome: string,
    public readonly motivo: string,
    public readonly suspensoPor?: string
  ) {
    super();
  }
}

export class EstabelecimentoDeliveryHabilitadoEvent extends DomainEvent {
  constructor(
    public readonly estabelecimentoId: string,
    public readonly taxaEntrega: number,
    public readonly raioEntrega: number,
    public readonly pedidoMinimo?: number
  ) {
    super();
  }
}

export class EstabelecimentoAvaliadoEvent extends DomainEvent {
  constructor(
    public readonly estabelecimentoId: string,
    public readonly nota: number,
    public readonly avaliacaoAnterior: number,
    public readonly novaMedia: number,
    public readonly totalAvaliacoes: number
  ) {
    super();
  }
}
