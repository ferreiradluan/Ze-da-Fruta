import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entrega } from '../../domain/entities/entrega.entity';
import { StatusEntrega } from '../../domain/enums/status-entrega.enum';

@Injectable()
export class EntregaRepository {
  constructor(
    @InjectRepository(Entrega)
    private readonly repository: Repository<Entrega>,
  ) {}

  async criar(entrega: Entrega): Promise<Entrega> {
    return this.repository.save(entrega);
  }

  async buscarPorId(id: string): Promise<Entrega | null> {
    return this.repository.findOne({ where: { id } });
  }

  async buscarPorPedidoId(pedidoId: string): Promise<Entrega | null> {
    return this.repository.findOne({ where: { pedidoId } });
  }

  async buscarPorEntregadorId(entregadorId: string): Promise<Entrega[]> {
    return this.repository.find({ 
      where: { entregadorId },
      order: { createdAt: 'DESC' }
    });
  }

  async buscarPorStatus(status: StatusEntrega): Promise<Entrega[]> {
    return this.repository.find({ 
      where: { status },
      order: { createdAt: 'DESC' }
    });
  }

  async atualizar(entrega: Entrega): Promise<Entrega> {
    return this.repository.save(entrega);
  }

  async buscarTodas(): Promise<Entrega[]> {
    return this.repository.find({ order: { createdAt: 'DESC' } });
  }

  async buscarEntregasPendentes(): Promise<Entrega[]> {
    return this.repository.find({
      where: [
        { status: StatusEntrega.AGUARDANDO_ACEITE },
        { status: StatusEntrega.PENDENTE }
      ],
      order: { createdAt: 'ASC' }
    });
  }
}
