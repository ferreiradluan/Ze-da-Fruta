import { DomainEvent } from './domain-event.base';

/**
 * Evento disparado quando um usuário é criado
 */
export class UsuarioCriadoEvent extends DomainEvent {
  public readonly eventName = 'usuario.criado';
  public readonly version = 1;

  constructor(
    public readonly usuarioId: string,
    public readonly email: string,
    public readonly nome: string,
    public readonly roles: string[]
  ) {
    super();
  }

  protected getData(): object {
    return {
      usuarioId: this.usuarioId,
      email: this.email,
      nome: this.nome,
      roles: this.roles
    };
  }
}

/**
 * Evento disparado quando um usuário é promovido a lojista
 */
export class UsuarioPromovidoEvent extends DomainEvent {
  public readonly eventName = 'usuario.promovido.lojista';
  public readonly version = 1;

  constructor(
    public readonly usuarioId: string,
    public readonly email: string,
    public readonly roleAnterior: string[],
    public readonly novaRole: string[]
  ) {
    super();
  }

  protected getData(): object {
    return {
      usuarioId: this.usuarioId,
      email: this.email,
      roleAnterior: this.roleAnterior,
      novaRole: this.novaRole
    };
  }
}

/**
 * Evento disparado quando um usuário é suspenso
 */
export class UsuarioSuspensoEvent extends DomainEvent {
  public readonly eventName = 'usuario.suspenso';
  public readonly version = 1;

  constructor(
    public readonly usuarioId: string,
    public readonly email: string,
    public readonly motivo?: string,
    public readonly suspensoPor?: string
  ) {
    super();
  }

  protected getData(): object {
    return {
      usuarioId: this.usuarioId,
      email: this.email,
      motivo: this.motivo,
      suspensoPor: this.suspensoPor
    };
  }
}

/**
 * Evento disparado quando perfil do usuário é completado
 */
export class PerfilCompletadoEvent extends DomainEvent {
  public readonly eventName = 'usuario.perfil.completado';
  public readonly version = 1;

  constructor(
    public readonly usuarioId: string,
    public readonly email: string
  ) {
    super();
  }

  protected getData(): object {
    return {
      usuarioId: this.usuarioId,
      email: this.email
    };
  }
}
