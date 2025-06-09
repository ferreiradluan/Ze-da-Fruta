import { DomainError } from '../../../common/domain/errors/domain-error.base';

export class CupomError extends DomainError {
  constructor(message: string, code?: string) {
    super(message, code || 'CUPOM_ERROR');
  }

  getUserMessage(): string {
    return 'Erro relacionado ao cupom de desconto.';
  }
}

export class CupomJaUtilizadoError extends CupomError {
  constructor(codigo: string) {
    super(`Cupom ${codigo} já foi utilizado`, 'CUPOM_JA_UTILIZADO');
  }
}

export class CupomExpiradoError extends CupomError {
  constructor(codigo: string, dataExpiracao: Date) {
    super(
      `Cupom ${codigo} expirou em ${dataExpiracao.toLocaleDateString()}`,
      'CUPOM_EXPIRADO'
    );
  }
}

export class CupomInativoError extends CupomError {
  constructor(codigo: string) {
    super(`Cupom ${codigo} está inativo`, 'CUPOM_INATIVO');
  }
}

export class CupomUsosExcedidosError extends CupomError {
  constructor(codigo: string, limitUsos: number) {
    super(
      `Cupom ${codigo} excedeu o limite de ${limitUsos} usos`,
      'CUPOM_USOS_EXCEDIDOS'
    );
  }
}

export class CupomValorMinimoNaoAtingidoError extends CupomError {
  constructor(codigo: string, valorMinimo: number, valorPedido: number) {
    super(
      `Cupom ${codigo} requer valor mínimo de R$ ${valorMinimo.toFixed(2)}, mas o pedido é de R$ ${valorPedido.toFixed(2)}`,
      'CUPOM_VALOR_MINIMO_NAO_ATINGIDO'
    );
  }
}

export class CupomEstabelecimentoInvalidoError extends CupomError {
  constructor(codigo: string, estabelecimentoId: string) {
    super(
      `Cupom ${codigo} não é válido para o estabelecimento ${estabelecimentoId}`,
      'CUPOM_ESTABELECIMENTO_INVALIDO'
    );
  }
}

export class CupomCodigoInvalidoError extends CupomError {
  constructor(codigo: string) {
    super(`Código de cupom inválido: ${codigo}`, 'CUPOM_CODIGO_INVALIDO');
  }
}

export class CupomPercentualInvalidoError extends CupomError {
  constructor(percentual: number) {
    super(
      `Percentual de desconto inválido: ${percentual}%. Deve estar entre 0 e 100`,
      'CUPOM_PERCENTUAL_INVALIDO'
    );
  }
}

export class CupomValorFixoInvalidoError extends CupomError {
  constructor(valor: number) {
    super(
      `Valor fixo de desconto inválido: R$ ${valor.toFixed(2)}. Deve ser maior que zero`,
      'CUPOM_VALOR_FIXO_INVALIDO'
    );
  }
}

export class CupomLimiteUsosInvalidoError extends CupomError {
  constructor(limite: number) {
    super(
      `Limite de usos inválido: ${limite}. Deve ser maior que zero`,
      'CUPOM_LIMITE_USOS_INVALIDO'
    );
  }
}

export class CupomDataValidadeInvalidaError extends CupomError {
  constructor() {
    super(
      'Data de validade deve ser posterior à data atual',
      'CUPOM_DATA_VALIDADE_INVALIDA'
    );
  }
}

export class CupomNaoEncontradoError extends CupomError {
  constructor(codigo: string) {
    super(`Cupom não encontrado: ${codigo}`, 'CUPOM_NAO_ENCONTRADO');
  }
}

export class CupomInvalidoError extends CupomError {
  constructor(message: string) {
    super(message, 'CUPOM_INVALIDO');
  }
}

export class CupomEsgotadoError extends CupomError {
  constructor(codigo: string) {
    super(`Cupom ${codigo} está esgotado`, 'CUPOM_ESGOTADO');
  }
}

export class ValorMinimoInvalidoError extends CupomError {
  constructor(message: string) {
    super(message, 'VALOR_MINIMO_INVALIDO');
  }
}
