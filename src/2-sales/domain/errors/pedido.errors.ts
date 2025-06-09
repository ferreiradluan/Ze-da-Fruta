import { DomainError, BusinessRuleViolationError, InvalidOperationError } from '../../../common/domain/errors/domain-error.base';

/**
 * Pedido-specific domain errors
 */
export class PedidoError extends DomainError {}

export class PedidoVazioError extends PedidoError {
  constructor() {
    super('Um pedido deve conter pelo menos um item', 'PEDIDO_VAZIO');
  }

  getUserMessage(): string {
    return 'O pedido deve conter pelo menos um item.';
  }
}

export class PedidoJaConfirmadoError extends PedidoError {
  constructor() {
    super('Este pedido já foi confirmado e não pode ser modificado', 'PEDIDO_JA_CONFIRMADO');
  }

  getUserMessage(): string {
    return 'Este pedido já foi confirmado e não pode ser modificado.';
  }
}

export class PedidoCanceladoError extends PedidoError {
  constructor() {
    super('Não é possível realizar esta operação em um pedido cancelado', 'PEDIDO_CANCELADO');
  }

  getUserMessage(): string {
    return 'Não é possível realizar esta operação em um pedido cancelado.';
  }
}

export class TransicaoStatusInvalidaError extends PedidoError {
  constructor(statusAtual: string, statusDestino: string) {
    super(
      `Transição de status inválida: ${statusAtual} → ${statusDestino}`,
      'TRANSICAO_STATUS_INVALIDA'
    );
  }

  getUserMessage(): string {
    return 'Não é possível alterar o pedido para este status.';
  }
}

export class ValorMinimoNaoAtingidoError extends PedidoError {
  constructor(valorMinimo: number, valorAtual: number) {
    super(
      `Valor mínimo de R$ ${valorMinimo.toFixed(2)} não atingido. Valor atual: R$ ${valorAtual.toFixed(2)}`,
      'VALOR_MINIMO_NAO_ATINGIDO'
    );
  }

  getUserMessage(): string {
    return 'O valor mínimo do pedido não foi atingido.';
  }
}

export class CupomInvalidoError extends PedidoError {
  constructor(motivo: string) {
    super(`Cupom inválido: ${motivo}`, 'CUPOM_INVALIDO');
  }

  getUserMessage(): string {
    return 'O cupom informado é inválido.';
  }
}

export class CupomExpiradoError extends PedidoError {
  constructor(codigo: string) {
    super(`Cupom '${codigo}' está expirado`, 'CUPOM_EXPIRADO');
  }

  getUserMessage(): string {
    return 'O cupom está expirado e não pode ser utilizado.';
  }
}

export class CupomJaUtilizadoError extends PedidoError {
  constructor(codigo: string) {
    super(`Cupom '${codigo}' já foi utilizado`, 'CUPOM_JA_UTILIZADO');
  }

  getUserMessage(): string {
    return 'Este cupom já foi utilizado anteriormente.';
  }
}

export class LimiteUsosCupomExcedidoError extends PedidoError {
  constructor(codigo: string) {
    super(`Limite de usos do cupom '${codigo}' foi excedido`, 'LIMITE_USOS_CUPOM_EXCEDIDO');
  }

  getUserMessage(): string {
    return 'O limite de usos deste cupom foi excedido.';
  }
}

export class PedidoInvalidoError extends PedidoError {
  constructor(message: string) {
    super(message, 'PEDIDO_INVALIDO');
  }

  getUserMessage(): string {
    return 'Os dados do pedido são inválidos.';
  }
}

export class PedidoNaoPodeSerEditadoError extends PedidoError {
  constructor(statusAtual: string) {
    super(`Pedido com status '${statusAtual}' não pode ser editado`, 'PEDIDO_NAO_PODE_SER_EDITADO');
  }

  getUserMessage(): string {
    return 'Este pedido não pode ser editado no status atual.';
  }
}

export class ItemPedidoNaoEncontradoError extends PedidoError {
  constructor(itemId: string) {
    super(`Item '${itemId}' não encontrado no pedido`, 'ITEM_PEDIDO_NAO_ENCONTRADO');
  }

  getUserMessage(): string {
    return 'O item solicitado não foi encontrado no pedido.';
  }
}

export class StatusPedidoInvalidoError extends PedidoError {
  constructor(statusAtual: string, statusEsperado: string) {
    super(
      `Status atual '${statusAtual}' não permite esta operação. Status esperado: '${statusEsperado}'`,
      'STATUS_PEDIDO_INVALIDO'
    );
  }

  getUserMessage(): string {
    return 'O status atual do pedido não permite esta operação.';
  }
}

/**
 * Item-specific domain errors
 */
export class ItemPedidoError extends DomainError {
  getUserMessage(): string {
    return 'Erro relacionado aos itens do pedido.';
  }
}

export class QuantidadeInvalidaError extends ItemPedidoError {
  constructor(quantidade: number) {
    super(`Quantidade inválida: ${quantidade}. Deve ser maior que zero`, 'QUANTIDADE_INVALIDA');
  }

  getUserMessage(): string {
    return 'A quantidade informada é inválida.';
  }
}

export class PrecoInvalidoError extends ItemPedidoError {
  constructor(preco: number) {
    super(`Preço inválido: ${preco}. Deve ser maior que zero`, 'PRECO_INVALIDO');
  }

  getUserMessage(): string {
    return 'O preço informado é inválido.';
  }
}
