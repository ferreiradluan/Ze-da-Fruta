import { DomainError, BusinessRuleViolationError, InvalidOperationError } from '../../../common/domain/errors/domain-error.base';
import { StatusEntrega } from '../enums/status-entrega.enum';

/**
 * Entrega-specific domain errors
 */
export class EntregaError extends DomainError {}

export class EntregaInvalidaError extends EntregaError {
  constructor(motivo: string) {
    super(`Entrega inválida: ${motivo}`, 'ENTREGA_INVALIDA');
  }

  getUserMessage(): string {
    return 'Os dados da entrega são inválidos. Verifique as informações fornecidas.';
  }
}

export class EntregaNaoEncontradaError extends EntregaError {
  constructor(entregaId: string) {
    super(`Entrega não encontrada: ${entregaId}`, 'ENTREGA_NAO_ENCONTRADA');
  }

  getUserMessage(): string {
    return 'A entrega solicitada não foi encontrada.';
  }
}

export class EntregaJaAceitaError extends EntregaError {
  constructor(entregaId: string) {
    super(`Entrega já foi aceita: ${entregaId}`, 'ENTREGA_JA_ACEITA');
  }

  getUserMessage(): string {
    return 'Esta entrega já foi aceita por outro entregador.';
  }
}

export class EntregaNaoPodeSerCanceladaError extends EntregaError {
  constructor(status: StatusEntrega) {
    super(`Entrega com status ${status} não pode ser cancelada`, 'ENTREGA_NAO_PODE_SER_CANCELADA');
  }

  getUserMessage(): string {
    return 'Esta entrega não pode ser cancelada no status atual.';
  }
}

export class TransicaoStatusEntregaInvalidaError extends EntregaError {
  constructor(statusAtual: StatusEntrega, statusDestino: StatusEntrega) {
    super(
      `Transição de status inválida: ${statusAtual} → ${statusDestino}`,
      'TRANSICAO_STATUS_ENTREGA_INVALIDA'
    );
  }

  getUserMessage(): string {
    return 'Não é possível alterar o status da entrega para o status solicitado.';
  }
}

export class EntregaSemEntregadorError extends EntregaError {
  constructor() {
    super('Não é possível iniciar entrega sem entregador definido', 'ENTREGA_SEM_ENTREGADOR');
  }

  getUserMessage(): string {
    return 'É necessário definir um entregador antes de iniciar a entrega.';
  }
}

export class EnderecoEntregaInvalidoError extends EntregaError {
  constructor(motivo: string) {
    super(`Endereço de entrega inválido: ${motivo}`, 'ENDERECO_ENTREGA_INVALIDO');
  }

  getUserMessage(): string {
    return 'O endereço de entrega informado é inválido.';
  }
}

export class EnderecoColetaInvalidoError extends EntregaError {
  constructor(motivo: string) {
    super(`Endereço de coleta inválido: ${motivo}`, 'ENDERECO_COLETA_INVALIDO');
  }

  getUserMessage(): string {
    return 'O endereço de coleta informado é inválido.';
  }
}

export class ValorFreteInvalidoError extends EntregaError {
  constructor(valor: number) {
    super(`Valor do frete inválido: ${valor}`, 'VALOR_FRETE_INVALIDO');
  }

  getUserMessage(): string {
    return 'O valor do frete informado é inválido.';
  }
}

export class PrevisaoEntregaInvalidaError extends EntregaError {
  constructor(motivo: string) {
    super(`Previsão de entrega inválida: ${motivo}`, 'PREVISAO_ENTREGA_INVALIDA');
  }

  getUserMessage(): string {
    return 'A previsão de entrega informada é inválida.';
  }
}

export class EntregaJaFinalizadaError extends EntregaError {
  constructor(status: StatusEntrega) {
    super(`Entrega já finalizada com status: ${status}`, 'ENTREGA_JA_FINALIZADA');
  }

  getUserMessage(): string {
    return 'Esta entrega já foi finalizada e não pode ser modificada.';
  }
}
