import { DomainError } from '../../../common/domain/errors/domain-error.base';

export class CategoriaInvalidaError extends DomainError {
  constructor(message: string) {
    super(message, 'CATEGORIA_INVALIDA');
  }

  getUserMessage(): string {
    return 'Dados da categoria são inválidos. Verifique as informações fornecidas.';
  }
}

export class CategoriaNaoEncontradaError extends DomainError {
  constructor(categoriaId: string) {
    super(`Categoria com ID '${categoriaId}' não foi encontrada`, 'CATEGORIA_NAO_ENCONTRADA');
  }

  getUserMessage(): string {
    return 'A categoria solicitada não foi encontrada.';
  }
}

export class CategoriaJaExisteError extends DomainError {
  constructor(nome: string) {
    super(`Categoria com nome '${nome}' já existe`, 'CATEGORIA_JA_EXISTE');
  }

  getUserMessage(): string {
    return 'Já existe uma categoria com este nome.';
  }
}

export class CategoriaComProdutosError extends DomainError {
  constructor(message: string = 'Categoria possui produtos associados') {
    super(message, 'CATEGORIA_COM_PRODUTOS');
  }

  getUserMessage(): string {
    return 'Não é possível excluir a categoria pois existem produtos associados a ela.';
  }
}

export class CategoriaInativaError extends DomainError {
  constructor(message: string = 'Categoria está inativa') {
    super(message, 'CATEGORIA_INATIVA');
  }

  getUserMessage(): string {
    return 'A categoria está inativa e não pode ser utilizada.';
  }
}
