import { DomainError, BusinessRuleViolationError, InvalidOperationError } from '../../../common/domain/errors/domain-error.base';
import { StatusEntregador, StatusDisponibilidade } from '../entities/entregador.entity';

/**
 * Entregador-specific domain errors
 */
export class EntregadorError extends DomainError {}

export class EntregadorInvalidoError extends EntregadorError {
  constructor(motivo: string) {
    super(`Entregador inválido: ${motivo}`, 'ENTREGADOR_INVALIDO');
  }

  getUserMessage(): string {
    return 'Os dados do entregador são inválidos. Verifique as informações fornecidas.';
  }
}

export class EntregadorNaoEncontradoError extends EntregadorError {
  constructor(entregadorId: string) {
    super(`Entregador não encontrado: ${entregadorId}`, 'ENTREGADOR_NAO_ENCONTRADO');
  }

  getUserMessage(): string {
    return 'O entregador solicitado não foi encontrado.';
  }
}

export class EntregadorIndisponivelError extends EntregadorError {
  constructor(entregadorId: string, status: StatusDisponibilidade) {
    super(`Entregador ${entregadorId} indisponível. Status: ${status}`, 'ENTREGADOR_INDISPONIVEL');
  }

  getUserMessage(): string {
    return 'O entregador não está disponível no momento.';
  }
}

export class EntregadorInativoError extends EntregadorError {
  constructor(entregadorId: string) {
    super(`Entregador inativo: ${entregadorId}`, 'ENTREGADOR_INATIVO');
  }

  getUserMessage(): string {
    return 'O entregador está inativo e não pode realizar entregas.';
  }
}

export class EmailEntregadorInvalidoError extends EntregadorError {
  constructor(email: string) {
    super(`Email inválido: ${email}`, 'EMAIL_ENTREGADOR_INVALIDO');
  }

  getUserMessage(): string {
    return 'O email informado não é válido.';
  }
}

export class TelefoneEntregadorInvalidoError extends EntregadorError {
  constructor(telefone: string) {
    super(`Telefone inválido: ${telefone}`, 'TELEFONE_ENTREGADOR_INVALIDO');
  }

  getUserMessage(): string {
    return 'O telefone informado não é válido.';
  }
}

export class CNHInvalidaError extends EntregadorError {
  constructor(cnh: string) {
    super(`CNH inválida: ${cnh}`, 'CNH_INVALIDA');
  }

  getUserMessage(): string {
    return 'O número da CNH informado não é válido.';
  }
}

export class VeiculoInvalidoError extends EntregadorError {
  constructor(motivo: string) {
    super(`Veículo inválido: ${motivo}`, 'VEICULO_INVALIDO');
  }

  getUserMessage(): string {
    return 'As informações do veículo são inválidas.';
  }
}

export class AvaliacaoInvalidaError extends EntregadorError {
  constructor(avaliacao: number) {
    super(`Avaliação inválida: ${avaliacao}. Deve estar entre 0 e 5`, 'AVALIACAO_INVALIDA');
  }

  getUserMessage(): string {
    return 'A avaliação deve estar entre 0 e 5 estrelas.';
  }
}

export class EntregadorComEntregasAtivas extends EntregadorError {
  constructor(entregadorId: string) {
    super(`Entregador ${entregadorId} possui entregas ativas e não pode ser desativado`, 'ENTREGADOR_COM_ENTREGAS_ATIVAS');
  }

  getUserMessage(): string {
    return 'Não é possível desativar o entregador pois ele possui entregas ativas.';
  }
}

export class TransicaoStatusEntregadorInvalidaError extends EntregadorError {
  constructor(statusAtual: StatusEntregador, statusDestino: StatusEntregador) {
    super(
      `Transição de status inválida: ${statusAtual} → ${statusDestino}`,
      'TRANSICAO_STATUS_ENTREGADOR_INVALIDA'
    );
  }

  getUserMessage(): string {
    return 'Não é possível alterar o status do entregador para o status solicitado.';
  }
}

export class TransicaoDisponibilidadeInvalidaError extends EntregadorError {
  constructor(statusAtual: StatusDisponibilidade, statusDestino: StatusDisponibilidade) {
    super(
      `Transição de disponibilidade inválida: ${statusAtual} → ${statusDestino}`,
      'TRANSICAO_DISPONIBILIDADE_INVALIDA'
    );
  }

  getUserMessage(): string {
    return 'Não é possível alterar a disponibilidade do entregador para o status solicitado.';
  }
}
