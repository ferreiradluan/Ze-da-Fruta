import { DomainEvent } from '../../../common/domain/events/domain-event.base';
import { StatusCupom, TipoCupom } from '../entities/cupom.entity';

export class CupomCriadoEvent extends DomainEvent {
  constructor(
    public readonly cupomId: string,
    public readonly codigo: string,
    public readonly tipo: TipoCupom,
    public readonly desconto: number,
    public readonly estabelecimentoId: string,
    public readonly dataExpiracao?: Date
  ) {
    super('CupomCriado', cupomId);
  }
}

export class CupomUtilizadoEvent extends DomainEvent {
  constructor(
    public readonly cupomId: string,
    public readonly codigo: string,
    public readonly pedidoId: string,
    public readonly clienteId: string,
    public readonly valorDesconto: number,
    public readonly dataUso: Date
  ) {
    super('CupomUtilizado', cupomId);
  }
}

export class CupomDesativadoEvent extends DomainEvent {
  constructor(
    public readonly cupomId: string,
    public readonly codigo: string,
    public readonly motivo: string,
    public readonly dataDesativacao: Date
  ) {
    super('CupomDesativado', cupomId);
  }
}

export class CupomReativadoEvent extends DomainEvent {
  constructor(
    public readonly cupomId: string,
    public readonly codigo: string,
    public readonly dataReativacao: Date
  ) {
    super('CupomReativado', cupomId);
  }
}

export class CupomExpiradoEvent extends DomainEvent {
  constructor(
    public readonly cupomId: string,
    public readonly codigo: string,
    public readonly dataExpiracao: Date
  ) {
    super('CupomExpirado', cupomId);
  }
}

export class CupomLimiteUsosAtingidoEvent extends DomainEvent {
  constructor(
    public readonly cupomId: string,
    public readonly codigo: string,
    public readonly limitUsos: number,
    public readonly dataLimiteAtingido: Date
  ) {
    super('CupomLimiteUsosAtingido', cupomId);
  }
}

export class CupomAtualizadoEvent extends DomainEvent {
  constructor(
    public readonly cupomId: string,
    public readonly codigo: string,
    public readonly camposAlterados: string[],
    public readonly dataAtualizacao: Date
  ) {
    super('CupomAtualizado', cupomId);
  }
}

export class CupomValidadoEvent extends DomainEvent {
  constructor(
    public readonly cupomId: string,
    public readonly codigo: string,
    public readonly pedidoId: string,
    public readonly valorPedido: number,
    public readonly valorDesconto: number,
    public readonly dataValidacao: Date
  ) {
    super('CupomValidado', cupomId);
  }
}

export class CupomRejeitadoEvent extends DomainEvent {
  constructor(
    public readonly cupomId: string,
    public readonly codigo: string,
    public readonly pedidoId: string,
    public readonly motivo: string,
    public readonly dataRejeicao: Date
  ) {
    super('CupomRejeitado', cupomId);
  }
}

export class CupomUsadoEvent extends DomainEvent {
  constructor(
    public readonly cupomId: string,
    public readonly codigo: string,
    public readonly pedidoId: string,
    public readonly clienteId: string,
    public readonly valorDesconto: number,
    public readonly dataUso: Date
  ) {
    super('CupomUsado', cupomId);
  }
}
