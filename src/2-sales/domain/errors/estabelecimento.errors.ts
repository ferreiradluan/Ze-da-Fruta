import { DomainError } from '../../../common/domain/errors/domain-error.base';

export class EstabelecimentoInvalidoError extends DomainError {
  constructor(message: string) {
    super(message, 'ESTABELECIMENTO_INVALIDO');
  }

  getUserMessage(): string {
    return 'Dados do estabelecimento são inválidos. Verifique as informações fornecidas.';
  }
}

export class EstabelecimentoInativoError extends DomainError {
  constructor(message: string = 'Estabelecimento está inativo') {
    super(message, 'ESTABELECIMENTO_INATIVO');
  }

  getUserMessage(): string {
    return 'O estabelecimento está inativo e não pode realizar operações.';
  }
}

export class CNPJInvalidoError extends DomainError {
  constructor(cnpj: string) {
    super(`CNPJ '${cnpj}' é inválido`, 'CNPJ_INVALIDO');
  }

  getUserMessage(): string {
    return 'O CNPJ informado é inválido. Verifique os dados.';
  }
}

export class EnderecoInvalidoError extends DomainError {
  constructor(message: string) {
    super(message, 'ENDERECO_INVALIDO');
  }

  getUserMessage(): string {
    return 'O endereço informado é inválido.';
  }
}

export class EmailInvalidoError extends DomainError {
  constructor(email: string) {
    super(`Email '${email}' é inválido`, 'EMAIL_INVALIDO');
  }

  getUserMessage(): string {
    return 'O e-mail informado é inválido.';
  }
}

export class TelefoneInvalidoError extends DomainError {
  constructor(telefone: string) {
    super(`Telefone '${telefone}' é inválido`, 'TELEFONE_INVALIDO');
  }

  getUserMessage(): string {
    return 'O telefone informado é inválido.';
  }
}

export class EstabelecimentoNaoEncontradoError extends DomainError {
  constructor(estabelecimentoId: string) {
    super(`Estabelecimento com ID '${estabelecimentoId}' não foi encontrado`, 'ESTABELECIMENTO_NAO_ENCONTRADO');
  }

  getUserMessage(): string {
    return 'Estabelecimento não encontrado.';
  }
}

export class HorarioFuncionamentoInvalidoError extends DomainError {
  constructor(message: string) {
    super(message, 'HORARIO_FUNCIONAMENTO_INVALIDO');
  }

  getUserMessage(): string {
    return 'Horário de funcionamento inválido.';
  }
}

export class DeliveryIndisponivelError extends DomainError {
  constructor(message: string = 'Delivery não disponível para este estabelecimento') {
    super(message, 'DELIVERY_INDISPONIVEL');
  }

  getUserMessage(): string {
    return 'Delivery não está disponível para este estabelecimento.';
  }
}
