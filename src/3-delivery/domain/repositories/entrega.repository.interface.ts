import { Entrega } from '../entities/entrega.entity';
import { StatusEntrega } from '../enums/status-entrega.enum';

/**
 * Repository interface for Entrega entity
 * Defines all domain-specific data access methods for deliveries
 */
export interface IEntregaRepository {
  /**
   * Busca entrega por ID
   */
  buscarPorId(id: string): Promise<Entrega | null>;

  /**
   * Busca entrega por ID do pedido
   */
  buscarPorPedidoId(pedidoId: string): Promise<Entrega | null>;

  /**
   * Busca entregas por entregador
   */
  buscarPorEntregadorId(entregadorId: string): Promise<Entrega[]>;

  /**
   * Busca entregas por status
   */
  buscarPorStatus(status: StatusEntrega): Promise<Entrega[]>;

  /**
   * Salva entrega (create ou update)
   */
  salvar(entrega: Entrega): Promise<Entrega>;

  /**
   * Busca entregas ativas por entregador
   */
  buscarEntregasAtivasPorEntregador(entregadorId: string): Promise<Entrega[]>;

  /**
   * Busca entregas pendentes de aceite
   */
  buscarEntregasPendentes(): Promise<Entrega[]>;

  /**
   * Busca entregas em rota
   */
  buscarEntregasEmRota(): Promise<Entrega[]>;

  /**
   * Busca entregas atrasadas
   */
  buscarEntregasAtrasadas(): Promise<Entrega[]>;

  /**
   * Busca entregas por período
   */
  buscarPorPeriodo(dataInicio: Date, dataFim: Date): Promise<Entrega[]>;

  /**
   * Busca entregas próximas ao vencimento
   */
  buscarProximasAoVencimento(minutos: number): Promise<Entrega[]>;

  /**
   * Remove entrega
   */
  remover(id: string): Promise<void>;

  /**
   * Lista todas as entregas
   */
  listarTodas(): Promise<Entrega[]>;
}
