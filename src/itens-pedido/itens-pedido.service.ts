import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemPedido } from '../common/entities/item-pedido.entity';

@Injectable()
export class ItensPedidoService {
  constructor(
    @InjectRepository(ItemPedido)
    private readonly itemPedidoRepository: Repository<ItemPedido>,
  ) {}

  findAll(): Promise<ItemPedido[]> {
    return this.itemPedidoRepository.find();
  }

  findOne(id: number): Promise<ItemPedido | null> {
    return this.itemPedidoRepository.findOneBy({ itemPedidoId : id });
  }

  create(itemPedido: Partial<ItemPedido>): Promise<ItemPedido> {
    const newItemPedido = this.itemPedidoRepository.create(itemPedido);
    return this.itemPedidoRepository.save(newItemPedido);
  }

  async update(id: number, itemPedido: Partial<ItemPedido>): Promise<ItemPedido | null> {
    const existingItemPedido = await this.findOne(id);
    if (!existingItemPedido) return null;
    Object.assign(existingItemPedido, itemPedido);
    return this.itemPedidoRepository.save(existingItemPedido);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.itemPedidoRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }
}