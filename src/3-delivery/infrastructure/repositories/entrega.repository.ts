import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entrega } from '../../domain/entities/entrega.entity';
import { StatusEntrega, StatusEntregaType } from '../../domain/constants/status-entrega.constants';

@Injectable()
export class EntregaRepository {
  constructor(
    @InjectRepository(Entrega)
    private readonly repository: Repository<Entrega>
  ) {}

  // ✅ MÉTODOS DO DIAGRAMA
  async findById(id: string): Promise<Entrega | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findDisponiveis(): Promise<Entrega[]> {
    return this.repository.find({
      where: { status: StatusEntrega.AGUARDANDO_ACEITE }
    });
  }

  async findByEntregadorId(entregadorId: string): Promise<Entrega[]> {
    return this.repository.find({
      where: { entregadorId }
    });
  }

  async findByPedidoId(pedidoId: string): Promise<Entrega | null> {
    return this.repository.findOne({
      where: { pedidoId }
    });
  }

  async findByStatus(status: StatusEntregaType): Promise<Entrega[]> {
    return this.repository.find({
      where: { status }
    });
  }

  async save(entrega: Entrega): Promise<Entrega> {
    return this.repository.save(entrega);
  }
}
