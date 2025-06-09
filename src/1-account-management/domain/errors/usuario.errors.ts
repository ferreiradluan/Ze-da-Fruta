import { 
  DomainError, 
  BusinessRuleViolationError, 
  EntityNotFoundError, 
  ValidationError 
} from '../../../common/domain/errors/domain-error.base';

/**
 * Base error for Usuario domain
 */
export abstract class UsuarioError extends DomainError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message, code, context);
  }
}

/**
 * Error thrown when email is already registered
 */
export class EmailJaCadastradoError extends BusinessRuleViolationError {
  constructor(email: string) {
    super(
      `Email '${email}' já está cadastrado`,
      'EMAIL_JA_CADASTRADO',
      { email }
    );
  }

  getUserMessage(): string {
    return 'Este email já está em uso. Tente fazer login ou use outro email.';
  }
}

/**
 * Error thrown when CPF is already registered
 */
export class CPFJaCadastradoError extends BusinessRuleViolationError {
  constructor(cpf: string) {
    super(
      `CPF '${cpf}' já está cadastrado`,
      'CPF_JA_CADASTRADO',
      { cpf }
    );
  }

  getUserMessage(): string {
    return 'Este CPF já está cadastrado. Verifique seus dados ou entre em contato com o suporte.';
  }
}

/**
 * Error thrown when user data is invalid
 */
export class UsuarioInvalidoError extends ValidationError {
  constructor(message: string) {
    super(
      message,
      'USUARIO_INVALIDO',
      'usuario'
    );
  }

  getUserMessage(): string {
    return 'Dados do usuário inválidos.';
  }
}

/**
 * Error thrown when password is invalid
 */
export class SenhaInvalidaError extends ValidationError {
  constructor(message: string) {
    super(
      message,
      'SENHA_INVALIDA',
      'senha'
    );
  }

  getUserMessage(): string {
    return 'Senha inválida.';
  }
}

/**
 * Error thrown when user profile is incorrect for operation
 */
export class PerfilIncorretoError extends BusinessRuleViolationError {
  constructor(message: string) {
    super(
      message,
      'PERFIL_INCORRETO'
    );
  }

  getUserMessage(): string {
    return 'Perfil do usuário não permite esta operação.';
  }
}

/**
 * Error thrown when password is weak
 */
export class SenhaFracaError extends ValidationError {
  constructor(requisitos: string[]) {
    super(
      `Senha não atende aos requisitos: ${requisitos.join(', ')}`,
      'SENHA_FRACA',
      'senha',
      { requisitosNaoAtendidos: requisitos }
    );
  }

  getUserMessage(): string {
    return 'A senha informada não atende aos critérios de segurança.';
  }
}

/**
 * Error thrown when trying to operate on inactive user
 */
export class UsuarioInativoError extends BusinessRuleViolationError {
  constructor(usuarioId: string) {
    super(
      `Usuário '${usuarioId}' está inativo`,
      'USUARIO_INATIVO',
      { usuarioId }
    );
  }

  getUserMessage(): string {
    return 'Esta conta está inativa. Entre em contato com o suporte.';
  }
}

/**
 * Error thrown when trying to operate on suspended user
 */
export class UsuarioSuspensoError extends BusinessRuleViolationError {
  constructor(usuarioId: string, motivo?: string, dataFim?: Date) {
    super(
      `Usuário '${usuarioId}' está suspenso${motivo ? `: ${motivo}` : ''}`,
      'USUARIO_SUSPENSO',
      { usuarioId, motivo, dataFim }
    );
  }

  getUserMessage(): string {
    return 'Esta conta está suspensa. Entre em contato com o suporte.';
  }
}

/**
 * Error thrown when user is not found
 */
export class UsuarioNaoEncontradoError extends EntityNotFoundError {
  constructor(identifier: string) {
    super('Usuario', identifier);
  }
}

/**
 * Error thrown when credentials are invalid
 */
export class CredenciaisInvalidasError extends BusinessRuleViolationError {
  constructor() {
    super(
      'Credenciais inválidas',
      'CREDENCIAIS_INVALIDAS'
    );
  }

  getUserMessage(): string {
    return 'Email ou senha incorretos.';
  }
}

/**
 * Error thrown when trying to perform operation without permission
 */
export class OperacaoNaoPermitidaError extends BusinessRuleViolationError {
  constructor(operacao: string, motivo?: string) {
    super(
      `Operação '${operacao}' não permitida${motivo ? `: ${motivo}` : ''}`,
      'OPERACAO_NAO_PERMITIDA',
      { operacao, motivo }
    );
  }

  getUserMessage(): string {
    return 'Você não tem permissão para realizar esta operação.';
  }
}

/**
 * Error thrown when password is incorrect
 */
export class SenhaIncorretaError extends BusinessRuleViolationError {
  constructor() {
    super(
      'Senha incorreta',
      'SENHA_INCORRETA'
    );
  }

  getUserMessage(): string {
    return 'A senha informada está incorreta.';
  }
}

/**
 * Error thrown when profile is incomplete for operation
 */
export class PerfilIncompletoError extends BusinessRuleViolationError {
  constructor(camposFaltantes: string[]) {
    super(
      `Perfil incompleto. Campos obrigatórios: ${camposFaltantes.join(', ')}`,
      'PERFIL_INCOMPLETO',
      { camposFaltantes }
    );
  }
  getUserMessage(): string {
    return 'Complete seu perfil para continuar.';
  }
}
