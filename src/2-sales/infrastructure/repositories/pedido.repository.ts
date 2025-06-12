import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from '../../domain/entities/pedido.entity';
import { StatusPedido } from '../../domain/enums/status-pedido.enum';

@Injectable()
export class PedidoRepository {
  constructor(
    @InjectRepository(Pedido)
    private readonly repository: Repository<Pedido>
  ) {}

  async criar(pedido: Pedido): Promise<Pedido> {
    return this.repository.save(pedido);
  }

  async buscarPorId(id: string): Promise<Pedido | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['itens', 'itens.produto', 'cupom']
    });
  }
  async buscarPorUsuario(userId: string): Promise<Pedido[]> {
    return this.repository.find({
      where: { clienteId: userId },
      relations: ['itens', 'itens.produto', 'cupom'],
      order: { createdAt: 'DESC' }
    });
  }

  async buscarPorStatus(status: StatusPedido): Promise<Pedido[]> {
    return this.repository.find({
      where: { status },
      relations: ['itens', 'itens.produto', 'cupom'],
      order: { createdAt: 'DESC' }
    });
  }

  async buscarPorEstabelecimento(estabelecimentoId: string): Promise<Pedido[]> {
    return this.repository
      .createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.itens', 'item')
      .leftJoinAndSelect('item.produto', 'produto')
      .leftJoinAndSelect('pedido.cupom', 'cupom')
      .where('produto.estabelecimentoId = :estabelecimentoId', { estabelecimentoId })
      .orderBy('pedido.createdAt', 'DESC')
      .getMany();
  }

  async atualizar(pedido: Pedido): Promise<Pedido> {
    return this.repository.save(pedido);
  }

  async remover(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async listarTodos(): Promise<Pedido[]> {
    return this.repository.find({
      relations: ['itens', 'itens.produto', 'cupom'],
      order: { createdAt: 'DESC' }
    });
  }
}
