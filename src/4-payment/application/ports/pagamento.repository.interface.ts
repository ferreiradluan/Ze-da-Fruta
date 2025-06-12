import { Pagamento } from '../../domain/entities/pagamento.entity';
import { StatusPagamento } from '../../domain/enums/status-pagamento.enum';

export interface IPagamentoRepository {
  criar(pagamento: Pagamento): Promise<Pagamento>;
  buscarPorId(id: string): Promise<Pagamento | null>;
  buscarPorPedidoId(pedidoId: string): Promise<Pagamento[]>;
  buscarPorStripeSessionId(stripeSessionId: string): Promise<Pagamento | null>;
  buscarPorStripePaymentIntentId(stripePaymentIntentId: string): Promise<Pagamento | null>;
  buscarPorStatus(status: StatusPagamento): Promise<Pagamento[]>;
  atualizar(pagamento: Pagamento): Promise<Pagamento>;
  buscarTodos(): Promise<Pagamento[]>;
}
