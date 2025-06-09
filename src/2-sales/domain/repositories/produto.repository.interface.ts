import { IAggregateRepository } from '../../../common/domain/repositories/domain-repository.interface';
import { Produto, StatusProduto, UnidadeMedida } from '../entities/produto.entity';

/**
 * Repository interface for Produto entity
 * Defines all domain-specific data access methods for products
 */
export interface IProdutoRepository extends IAggregateRepository<Produto> {
  /**
   * Finds products by category
   */
  findByCategoria(categoriaId: string): Promise<Produto[]>;

  /**
   * Finds products by establishment
   */
  findByEstabelecimento(estabelecimentoId: string): Promise<Produto[]>;

  /**
   * Finds products by status
   */
  findByStatus(status: StatusProduto): Promise<Produto[]>;

  /**
   * Finds products with stock below critical level
   */
  findWithCriticalStock(): Promise<Produto[]>;

  /**
   * Finds products with stock below a specific quantity
   */
  findWithLowStock(quantity: number): Promise<Produto[]>;

  /**
   * Finds products by price range
   */
  findByPriceRange(minPrice: number, maxPrice: number): Promise<Produto[]>;

  /**
   * Search products by name or description
   */
  searchByNameOrDescription(searchTerm: string): Promise<Produto[]>;

  /**
   * Finds products by unit of measure
   */
  findByUnidadeMedida(unidade: UnidadeMedida): Promise<Produto[]>;

  /**
   * Finds featured/promoted products
   */
  findFeatured(): Promise<Produto[]>;

  /**
   * Finds products with active promotions
   */
  findWithActivePromotions(): Promise<Produto[]>;

  /**
   * Finds products that are running out of stock (configurable threshold)
   */
  findRunningOutOfStock(threshold: number): Promise<Produto[]>;

  /**
   * Finds recently added products
   */
  findRecentlyAdded(days: number): Promise<Produto[]>;

  /**
   * Finds products with no recent sales
   */
  findWithNoRecentSales(days: number): Promise<Produto[]>;

  /**
   * Gets product statistics by category
   */
  getStatisticsByCategory(): Promise<{ categoriaId: string; count: number; totalValue: number }[]>;

  /**
   * Finds products by multiple filters
   */
  findByFilters(filters: {
    categoriaId?: string;
    estabelecimentoId?: string;
    status?: StatusProduto;
    minPrice?: number;
    maxPrice?: number;
    searchTerm?: string;
    unidadeMedida?: UnidadeMedida;
    hasStock?: boolean;
  }): Promise<Produto[]>;

  /**
   * Bulk update product status
   */
  bulkUpdateStatus(productIds: string[], newStatus: StatusProduto): Promise<void>;

  /**
   * Reserve stock for multiple products
   */
  reserveStock(reservations: { produtoId: string; quantidade: number }[]): Promise<void>;

  /**
   * Release stock reservations
   */
  releaseStockReservations(reservationIds: string[]): Promise<void>;

  /**
   * Gets total inventory value
   */
  getTotalInventoryValue(): Promise<number>;

  /**
   * Finds products with expired promotions
   */
  findWithExpiredPromotions(): Promise<Produto[]>;
}
