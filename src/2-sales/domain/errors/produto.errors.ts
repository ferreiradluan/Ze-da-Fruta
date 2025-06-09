import { DomainError, BusinessRuleViolationError, InvalidOperationError } from '../../../common/domain/errors/domain-error.base';

/**
 * Produto-specific domain errors
 */
export class ProdutoError extends DomainError {
  getUserMessage(): string {
    return 'Erro relacionado ao produto.';
  }
}

export class ProdutoInvalidoError extends ProdutoError {
  constructor(message: string) {
    super(message, 'PRODUTO_INVALIDO');
  }

  getUserMessage(): string {
    return 'Os dados do produto são inválidos.';
  }
}

export class EstoqueInsuficienteError extends ProdutoError {
  constructor(estoque: number, solicitado: number, produtoNome?: string) {
    const nome = produtoNome ? ` para ${produtoNome}` : '';
    super(
      `Estoque insuficiente${nome}. Disponível: ${estoque}, Solicitado: ${solicitado}`,
      'ESTOQUE_INSUFICIENTE'
    );
  }

  getUserMessage(): string {
    return 'Estoque insuficiente para atender o pedido.';
  }
}

export class ProdutoInativoError extends ProdutoError {
  constructor(produtoNome?: string) {
    const nome = produtoNome ? ` '${produtoNome}'` : '';
    super(`Produto${nome} está inativo`, 'PRODUTO_INATIVO');
  }

  getUserMessage(): string {
    return 'Este produto está inativo e não pode ser adicionado ao pedido.';
  }
}

export class PrecoInvalidoError extends ProdutoError {
  constructor(preco: number) {
    super(`Preço inválido: R$ ${preco}. Deve ser maior que zero`, 'PRECO_INVALIDO');
  }

  getUserMessage(): string {
    return 'O preço do produto é inválido.';
  }
}

export class EstoqueCriticoError extends ProdutoError {
  constructor(produtoNome: string, estoqueAtual: number, estoqueMinimo: number) {
    super(
      `Estoque crítico para '${produtoNome}': ${estoqueAtual} (mínimo: ${estoqueMinimo})`,
      'ESTOQUE_CRITICO'
    );
  }

  getUserMessage(): string {
    return 'O estoque deste produto está crítico.';
  }
}

export class CategoriaNaoEncontradaError extends ProdutoError {
  constructor(categoriaId: string) {
    super(`Categoria '${categoriaId}' não encontrada`, 'CATEGORIA_NAO_ENCONTRADA');
  }

  getUserMessage(): string {
    return 'A categoria do produto não foi encontrada.';
  }
}

export class EstabelecimentoNaoEncontradoError extends ProdutoError {
  constructor(estabelecimentoId: string) {
    super(`Estabelecimento '${estabelecimentoId}' não encontrado`, 'ESTABELECIMENTO_NAO_ENCONTRADO');
  }

  getUserMessage(): string {
    return 'O estabelecimento não foi encontrado.';
  }
}

export class UnidadeMedidaInvalidaError extends ProdutoError {
  constructor(unidade: string) {
    super(`Unidade de medida inválida: '${unidade}'`, 'UNIDADE_MEDIDA_INVALIDA');
  }

  getUserMessage(): string {
    return 'A unidade de medida informada é inválida.';
  }
}

export class ReservaEstoqueError extends ProdutoError {
  constructor(message: string) {
    super(message, 'RESERVA_ESTOQUE_ERROR');
  }

  getUserMessage(): string {
    return 'Erro ao reservar estoque do produto.';
  }
}
