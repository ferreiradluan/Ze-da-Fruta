import { BaseDomainEvent } from '../../../common/domain/events/domain-event.base';

/**
 * Event fired when a new user is created
 */
export class UsuarioCriadoEvent extends BaseDomainEvent {
  constructor(
    usuarioId: string,
    payload: {
      nome: string;
      email: string;
      tipo: string;
      cpf?: string;
      telefone?: string;
    }
  ) {
    super(usuarioId, 'Usuario', 'UsuarioCriado', payload);
  }
}

/**
 * Event fired when a user is updated
 */
export class UsuarioAtualizadoEvent extends BaseDomainEvent {
  constructor(
    usuarioId: string,
    payload: {
      camposAlterados: string[];
      valoresAnteriores: Record<string, any>;
      valoresNovos: Record<string, any>;
    }
  ) {
    super(usuarioId, 'Usuario', 'UsuarioAtualizado', payload);
  }
}

/**
 * Event fired when a user is deactivated
 */
export class UsuarioDesativadoEvent extends BaseDomainEvent {
  constructor(
    usuarioId: string,
    payload: {
      motivo?: string;
      dataDesativacao: Date;
    }
  ) {
    super(usuarioId, 'Usuario', 'UsuarioDesativado', payload);
  }
}

/**
 * Event fired when a user is suspended
 */
export class UsuarioSuspensoEvent extends BaseDomainEvent {
  constructor(
    usuarioId: string,
    payload: {
      motivo: string;
      dataFimSuspensao?: Date;
      suspensoAte?: Date;
    }
  ) {
    super(usuarioId, 'Usuario', 'UsuarioSuspenso', payload);
  }
}

/**
 * Event fired when a user password is changed
 */
export class SenhaAlteradaEvent extends BaseDomainEvent {
  constructor(
    usuarioId: string,
    payload: {
      alteradoPeloUsuario: boolean;
      dataAlteracao: Date;
      forcaAnterior?: number;
      forcaNova?: number;
    }
  ) {
    super(usuarioId, 'Usuario', 'SenhaAlterada', payload);
  }
}

/**
 * Event fired when a user is promoted (e.g., from client to lojista)
 */
export class UsuarioPromovido extends BaseDomainEvent {
  constructor(
    usuarioId: string,
    payload: {
      tipoAnterior: string;
      tipoNovo: string;
      dataPromocao: Date;
      motivo?: string;
    }
  ) {
    super(usuarioId, 'Usuario', 'UsuarioPromovido', payload);
  }
}

/**
 * Event fired when a user profile is completed
 */
export class PerfilCompletoEvent extends BaseDomainEvent {
  constructor(
    usuarioId: string,
    payload: {
      dataCompleto: Date;
      camposCompletados: string[];
    }
  ) {
    super(usuarioId, 'Usuario', 'PerfilCompleto', payload);
  }
}

/**
 * Event fired when a user attempts login
 */
export class TentativaLoginEvent extends BaseDomainEvent {
  constructor(
    usuarioId: string,
    payload: {
      sucesso: boolean;
      dataIniciativa: Date;
      ip?: string;
      userAgent?: string;
      motivo?: string;
    }
  ) {
    super(usuarioId, 'Usuario', 'TentativaLogin', payload);
  }
}
