import { Pagamento } from '../entities/pagamento.entity';

export interface IPagamentoRepository {
  findByPedidoId(pedidoId: string): Promise<Pagamento | null>;
  findByTransacaoExternaId(id: string): Promise<Pagamento | null>;
  save(pagamento: Pagamento): Promise<Pagamento>;
}
