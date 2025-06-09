import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, LessThan } from 'typeorm';
import { Entrega } from '../../domain/entities/entrega.entity';
import { StatusEntrega } from '../../domain/enums/status-entrega.enum';
import { IEntregaRepository } from '../../domain/repositories/entrega.repository.interface';

@Injectable()
export class EntregaRepository implements IEntregaRepository {
  constructor(
    @InjectRepository(Entrega)
    private readonly repository: Repository<Entrega>,
  ) {}

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

  async salvar(entrega: Entrega): Promise<Entrega> {
    return this.repository.save(entrega);
  }

  async buscarEntregasAtivasPorEntregador(entregadorId: string): Promise<Entrega[]> {
    return this.repository.find({
      where: {
        entregadorId,
        status: In([
          StatusEntrega.ACEITA,
          StatusEntrega.EM_ROTA,
          StatusEntrega.PENDENTE
        ])
      },
      order: { createdAt: 'DESC' }
    });
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

  async buscarEntregasEmRota(): Promise<Entrega[]> {
    return this.repository.find({
      where: { status: StatusEntrega.EM_ROTA },
      order: { dataRetirada: 'ASC' }
    });
  }

  async buscarEntregasAtrasadas(): Promise<Entrega[]> {
    const agora = new Date();
    
    return this.repository
      .createQueryBuilder('entrega')
      .where('entrega.previsaoEntrega < :agora', { agora })
      .andWhere('entrega.status NOT IN (:...statusFinalizados)', {
        statusFinalizados: [StatusEntrega.ENTREGUE, StatusEntrega.CANCELADA]
      })
      .orderBy('entrega.previsaoEntrega', 'ASC')
      .getMany();
  }

  async buscarPorPeriodo(dataInicio: Date, dataFim: Date): Promise<Entrega[]> {
    return this.repository.find({
      where: {
        createdAt: Between(dataInicio, dataFim)
      },
      order: { createdAt: 'DESC' }
    });
  }

  async buscarProximasAoVencimento(minutos: number): Promise<Entrega[]> {
    const agora = new Date();
    const limite = new Date(agora.getTime() + minutos * 60 * 1000);
    
    return this.repository
      .createQueryBuilder('entrega')
      .where('entrega.previsaoEntrega BETWEEN :agora AND :limite', { agora, limite })
      .andWhere('entrega.status NOT IN (:...statusFinalizados)', {
        statusFinalizados: [StatusEntrega.ENTREGUE, StatusEntrega.CANCELADA]
      })
      .orderBy('entrega.previsaoEntrega', 'ASC')
      .getMany();
  }

  async remover(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async listarTodas(): Promise<Entrega[]> {
    return this.repository.find({ order: { createdAt: 'DESC' } });
  }

  // Métodos para compatibilidade com código existente
  async criar(entrega: Entrega): Promise<Entrega> {
    return this.salvar(entrega);
  }

  async atualizar(entrega: Entrega): Promise<Entrega> {
    return this.salvar(entrega);
  }

  async buscarTodas(): Promise<Entrega[]> {
    return this.listarTodas();
  }
}
