import { Specification, CompositeSpecification, AndSpecification, OrSpecification, NotSpecification } from '../../../common/domain/specifications/specification.base';
import { Produto, StatusProduto, UnidadeMedida } from '../entities/produto.entity';

/**
 * Base specification for products
 */
export abstract class ProdutoSpecification extends Specification<Produto> {}

/**
 * Specification to check if product is active
 */
export class ProdutoAtivoSpecification extends ProdutoSpecification {
  isSatisfiedBy(produto: Produto): boolean {
    return produto.status === StatusProduto.ATIVO;
  }

  toString(): string {
    return 'Product is active';
  }
}

/**
 * Specification to check if product has sufficient stock
 */
export class ProdutoComEstoqueSuficienteSpecification extends ProdutoSpecification {
  constructor(private quantidadeMinima: number) {
    super();
  }

  isSatisfiedBy(produto: Produto): boolean {
    return produto.estoque >= this.quantidadeMinima;
  }

  toString(): string {
    return `Product has at least ${this.quantidadeMinima} items in stock`;
  }
}

/**
 * Specification to check if product is in critical stock level
 */
export class ProdutoEstoqueCriticoSpecification extends ProdutoSpecification {
  isSatisfiedBy(produto: Produto): boolean {
    return produto.estoque <= produto.estoqueCritico;
  }

  toString(): string {
    return 'Product has critical stock level';
  }
}

/**
 * Specification to check if product price is within range
 */
export class ProdutoPrecoFaixaSpecification extends ProdutoSpecification {
  constructor(
    private precoMinimo: number,
    private precoMaximo: number
  ) {
    super();
  }

  isSatisfiedBy(produto: Produto): boolean {
    return produto.preco >= this.precoMinimo && produto.preco <= this.precoMaximo;
  }

  toString(): string {
    return `Product price is between ${this.precoMinimo} and ${this.precoMaximo}`;
  }
}

/**
 * Specification to check if product belongs to a specific category
 */
export class ProdutoCategoriaSpecification extends ProdutoSpecification {
  constructor(private categoriaId: string) {
    super();
  }

  isSatisfiedBy(produto: Produto): boolean {
    return produto.categoria?.id === this.categoriaId;
  }

  toString(): string {
    return `Product belongs to category ${this.categoriaId}`;
  }
}

/**
 * Specification to check if product is from a specific establishment
 */
export class ProdutoEstabelecimentoSpecification extends ProdutoSpecification {
  constructor(private estabelecimentoId: string) {
    super();
  }

  isSatisfiedBy(produto: Produto): boolean {
    return produto.estabelecimento?.id === this.estabelecimentoId;
  }

  toString(): string {
    return `Product belongs to establishment ${this.estabelecimentoId}`;
  }
}

/**
 * Specification to check if product has promotion active
 */
export class ProdutoComPromocaoAtivaSpecification extends ProdutoSpecification {
  isSatisfiedBy(produto: Produto): boolean {
    return produto.promocaoAtiva;
  }

  toString(): string {
    return 'Product has active promotion';
  }
}

/**
 * Specification to check if product name contains search term
 */
export class ProdutoNomeContainSpecification extends ProdutoSpecification {
  constructor(private searchTerm: string) {
    super();
  }

  isSatisfiedBy(produto: Produto): boolean {
    return produto.nome.toLowerCase().includes(this.searchTerm.toLowerCase());
  }

  toString(): string {
    return `Product name contains "${this.searchTerm}"`;
  }
}

/**
 * Specification to check if product has specific unit of measure
 */
export class ProdutoUnidadeMedidaSpecification extends ProdutoSpecification {
  constructor(private unidadeMedida: UnidadeMedida) {
    super();
  }

  isSatisfiedBy(produto: Produto): boolean {
    return produto.unidadeMedida === this.unidadeMedida;
  }

  toString(): string {
    return `Product has unit of measure ${this.unidadeMedida}`;
  }
}

/**
 * Specification to check if product is available for sale
 * Combines multiple business rules
 */
export class ProdutoDisponivelParaVendaSpecification extends CompositeSpecification<Produto> {
  constructor(quantidadeDesejada: number = 1) {
    const isActive = new ProdutoAtivoSpecification();
    const hasSufficientStock = new ProdutoComEstoqueSuficienteSpecification(quantidadeDesejada);
    
    // Product is available if it's active AND has sufficient stock
    super(new AndSpecification(isActive, hasSufficientStock));
  }

  toString(): string {
    return 'Product is available for sale (active and has sufficient stock)';
  }
}

/**
 * Specification to check if product needs restock
 * Product needs restock if it's active and has critical stock
 */
export class ProdutoPrecisaReposicaoSpecification extends CompositeSpecification<Produto> {
  constructor() {
    const isActive = new ProdutoAtivoSpecification();
    const hasCriticalStock = new ProdutoEstoqueCriticoSpecification();
    
    super(new AndSpecification(isActive, hasCriticalStock));
  }

  toString(): string {
    return 'Product needs restocking (active with critical stock level)';
  }
}

/**
 * Specification for featured products
 * Featured products are active, have stock, and have active promotion
 */
export class ProdutoDestacadoSpecification extends CompositeSpecification<Produto> {
  constructor() {
    const isActive = new ProdutoAtivoSpecification();
    const hasStock = new ProdutoComEstoqueSuficienteSpecification(1);
    const hasPromotion = new ProdutoComPromocaoAtivaSpecification();
    
    super(new AndSpecification(
      new AndSpecification(isActive, hasStock),
      hasPromotion
    ));
  }

  toString(): string {
    return 'Product is featured (active, has stock, and has promotion)';
  }
}

/**
 * Factory class to create common product specifications
 */
export class ProdutoSpecificationFactory {
  static criarDisponivelParaVenda(quantidade: number = 1): ProdutoDisponivelParaVendaSpecification {
    return new ProdutoDisponivelParaVendaSpecification(quantidade);
  }

  static criarPrecisaReposicao(): ProdutoPrecisaReposicaoSpecification {
    return new ProdutoPrecisaReposicaoSpecification();
  }

  static criarDestacado(): ProdutoDestacadoSpecification {
    return new ProdutoDestacadoSpecification();
  }

  static criarPorCategoria(categoriaId: string): ProdutoCategoriaSpecification {
    return new ProdutoCategoriaSpecification(categoriaId);
  }

  static criarPorFaixaPreco(minimo: number, maximo: number): ProdutoPrecoFaixaSpecification {
    return new ProdutoPrecoFaixaSpecification(minimo, maximo);
  }

  static criarBuscarPorNome(termo: string): ProdutoNomeContainSpecification {
    return new ProdutoNomeContainSpecification(termo);
  }

  static criarComEstoqueSuficiente(quantidade: number): ProdutoComEstoqueSuficienteSpecification {
    return new ProdutoComEstoqueSuficienteSpecification(quantidade);
  }
}
