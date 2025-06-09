import { IAggregateRepository } from '../../../common/domain/repositories/domain-repository.interface';
import { Pedido, TipoPedido, FormaPagamento } from '../entities/pedido.entity';
import { StatusPedido } from '../enums/status-pedido.enum';

/**
 * Repository interface for Pedido entity
 * Defines all domain-specific data access methods for orders
 */
export interface IPedidoRepository extends IAggregateRepository<Pedido> {
  /**
   * Finds orders by customer
   */
  findByCliente(clienteId: string): Promise<Pedido[]>;

  /**
   * Finds orders by establishment
   */
  findByEstabelecimento(estabelecimentoId: string): Promise<Pedido[]>;

  /**
   * Finds orders by status
   */
  findByStatus(status: StatusPedido): Promise<Pedido[]>;

  /**
   * Finds orders by type
   */
  findByTipo(tipo: TipoPedido): Promise<Pedido[]>;

  /**
   * Finds orders by payment method
   */
  findByFormaPagamento(formaPagamento: FormaPagamento): Promise<Pedido[]>;

  /**
   * Finds orders created within a date range
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<Pedido[]>;

  /**
   * Finds orders with total value within a range
   */
  findByValueRange(minValue: number, maxValue: number): Promise<Pedido[]>;

  /**
   * Finds pending orders older than specified minutes
   */
  findPendingOrdersOlderThan(minutes: number): Promise<Pedido[]>;

  /**
   * Finds orders awaiting delivery
   */
  findAwaitingDelivery(): Promise<Pedido[]>;

  /**
   * Finds orders by delivery person
   */
  findByEntregador(entregadorId: string): Promise<Pedido[]>;

  /**
   * Finds orders with applied coupons
   */
  findWithCoupons(): Promise<Pedido[]>;

  /**
   * Finds orders that contain a specific product
   */
  findContainingProduct(produtoId: string): Promise<Pedido[]>;

  /**
   * Gets order statistics by status
   */
  getStatisticsByStatus(): Promise<{ status: StatusPedido; count: number; totalValue: number }[]>;

  /**
   * Gets order statistics by type
   */
  getStatisticsByType(): Promise<{ tipo: TipoPedido; count: number; totalValue: number }[]>;

  /**
   * Gets daily order count and revenue
   */
  getDailyStatistics(date: Date): Promise<{ count: number; totalRevenue: number }>;

  /**
   * Gets monthly order statistics
   */
  getMonthlyStatistics(year: number, month: number): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    topProducts: { produtoId: string; quantidade: number }[];
  }>;

  /**
   * Finds orders by multiple filters
   */
  findByFilters(filters: {
    clienteId?: string;
    estabelecimentoId?: string;
    status?: StatusPedido;
    tipo?: TipoPedido;
    formaPagamento?: FormaPagamento;
    startDate?: Date;
    endDate?: Date;
    minValue?: number;
    maxValue?: number;
    entregadorId?: string;
    hasCoupons?: boolean;
  }): Promise<Pedido[]>;

  /**
   * Bulk update order status
   */
  bulkUpdateStatus(orderIds: string[], newStatus: StatusPedido): Promise<void>;

  /**
   * Gets top customers by order value
   */
  getTopCustomers(limit: number): Promise<{ clienteId: string; totalSpent: number; orderCount: number }[]>;

  /**
   * Gets abandoned orders (pending for too long)
   */
  findAbandonedOrders(cutoffDate: Date): Promise<Pedido[]>;

  /**
   * Gets average delivery time by region
   */
  getAverageDeliveryTimeByRegion(): Promise<{ regiao: string; averageTime: number }[]>;

  /**
   * Finds orders that need delivery assignment
   */
  findNeedingDeliveryAssignment(): Promise<Pedido[]>;

  /**
   * Gets cancellation rate by period
   */
  getCancellationRate(startDate: Date, endDate: Date): Promise<number>;
}
