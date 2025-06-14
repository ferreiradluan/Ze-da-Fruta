import { DomainEvent } from '../../../common/domain/events/domain-event';

/**
 * Evento disparado quando um usuário é criado
 */
export class UsuarioCriadoEvent extends DomainEvent {
  readonly eventName = 'usuario.criado';

  constructor(
    public readonly aggregateId: string, // usuarioId
    public readonly nome: string,
    public readonly email: string
  ) {
    super();
  }

  protected getData(): Record<string, any> {
    return {
      nome: this.nome,
      email: this.email
    };
  }
}

/**
 * Evento disparado quando um usuário é promovido a lojista
 */
export class UsuarioPromovido extends DomainEvent {
  readonly eventName = 'usuario.promovido';

  constructor(
    public readonly aggregateId: string, // usuarioId
    public readonly novaRole: string,
    public readonly email: string
  ) {
    super();
  }

  protected getData(): Record<string, any> {
    return {
      novaRole: this.novaRole,
      email: this.email
    };
  }
}

/**
 * Evento disparado quando o status de um usuário é alterado
 */
export class UsuarioStatusAlteradoEvent extends DomainEvent {
  readonly eventName = 'usuario.status-alterado';

  constructor(
    public readonly aggregateId: string, // usuarioId
    public readonly statusAnterior: string,
    public readonly novoStatus: string
  ) {
    super();
  }

  protected getData(): Record<string, any> {
    return {
      statusAnterior: this.statusAnterior,
      novoStatus: this.novoStatus
    };
  }
}
