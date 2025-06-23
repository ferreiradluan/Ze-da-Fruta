import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Pedido } from './pedido.entity';

@Entity({ name: 'item_pedido' })
export class ItemPedido {
  @PrimaryGeneratedColumn({ name: 'item_pedidoId' })
  itemPedidoId!: number;

  @Column()
  produtoId!: number;

  @Column()
  quantidade!: number;

  @ManyToOne(() => Pedido, (pedido) => pedido.itens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pedidoId', referencedColumnName: 'pedidoId' })
  pedido!: Pedido;
}