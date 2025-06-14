import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Pagamento } from '../../domain/entities/pagamento.entity';
import { IPagamentoRepository } from '../../domain/repositories/pagamento.repository.interface';

@Injectable()
export class PagamentoRepository implements IPagamentoRepository {
  constructor(
    @InjectRepository(Pagamento)
    private readonly repository: Repository<Pagamento>
  ) {}

  // ✅ APENAS os 3 métodos especificados no diagrama
  async findByPedidoId(pedidoId: string): Promise<Pagamento | null> {
    return this.repository.findOne({ where: { pedidoId } });
  }

  async findByTransacaoExternaId(id: string): Promise<Pagamento | null> {
    return this.repository.findOne({ where: { idTransacaoExterna: id } });
  }

  async save(pagamento: Pagamento): Promise<Pagamento> {
    return this.repository.save(pagamento);
  }
}
