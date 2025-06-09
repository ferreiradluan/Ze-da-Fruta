import { DomainError } from '../../../common/domain/errors/domain-error.base';

export class ItemPedidoInvalidoError extends DomainError {
  constructor(message: string) {
    super(message, 'ITEM_PEDIDO_INVALIDO');
  }

  getUserMessage(): string {
    return 'Item do pedido é inválido. Verifique as informações.';
  }
}

export class QuantidadeInvalidaError extends DomainError {
  constructor(message: string) {
    super(message, 'QUANTIDADE_INVALIDA');
  }

  getUserMessage(): string {
    return 'Quantidade informada é inválida.';
  }
}

export class PrecoInvalidoError extends DomainError {
  constructor(message: string) {
    super(message, 'PRECO_INVALIDO');
  }

  getUserMessage(): string {
    return 'Preço informado é inválido.';
  }
}

export class ProdutoIndisponivelError extends DomainError {
  constructor(nomeProduto: string) {
    super(`Produto '${nomeProduto}' não está disponível`, 'PRODUTO_INDISPONIVEL');
  }

  getUserMessage(): string {
    return 'O produto selecionado não está disponível no momento.';
  }
}

export class PersonalizacaoInvalidaError extends DomainError {
  constructor(message: string) {
    super(message, 'PERSONALIZACAO_INVALIDA');
  }

  getUserMessage(): string {
    return 'Personalização do produto é inválida.';
  }
}

export class ObservacaoInvalidaError extends DomainError {
  constructor(message: string) {
    super(message, 'OBSERVACAO_INVALIDA');
  }

  getUserMessage(): string {
    return 'Observação do item é inválida.';
  }
}

export class DescontoInvalidoError extends DomainError {
  constructor(message: string) {
    super(message, 'DESCONTO_INVALIDO');
  }

  getUserMessage(): string {
    return 'Desconto aplicado é inválido.';
  }
}
