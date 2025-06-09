import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pagamento } from '../../domain/entities/pagamento.entity';
import { StatusPagamento } from '../../domain/enums/status-pagamento.enum';

@Injectable()
export class PagamentoRepository {
  constructor(
    @InjectRepository(Pagamento)
    private readonly repository: Repository<Pagamento>
  ) {}

  async criar(pagamento: Pagamento): Promise<Pagamento> {
    return this.repository.save(pagamento);
  }

  async buscarPorId(id: string): Promise<Pagamento | null> {
    return this.repository.findOne({ where: { id } });
  }

  async buscarPorPedidoId(pedidoId: string): Promise<Pagamento[]> {
    return this.repository.find({ 
      where: { pedidoId },
      order: { createdAt: 'DESC' }
    });
  }

  async buscarPorStripeSessionId(stripeSessionId: string): Promise<Pagamento | null> {
    return this.repository.findOne({ where: { stripeSessionId } });
  }

  async buscarPorStripePaymentIntentId(stripePaymentIntentId: string): Promise<Pagamento | null> {
    return this.repository.findOne({ where: { stripePaymentIntentId } });
  }

  async buscarPorStatus(status: StatusPagamento): Promise<Pagamento[]> {
    return this.repository.find({ 
      where: { status },
      order: { createdAt: 'DESC' }
    });
  }

  async atualizar(pagamento: Pagamento): Promise<Pagamento> {
    return this.repository.save(pagamento);
  }

  async buscarTodos(): Promise<Pagamento[]> {
    return this.repository.find({ order: { createdAt: 'DESC' } });
  }
}
