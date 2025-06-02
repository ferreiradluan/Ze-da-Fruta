import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ItemPedido } from './item-pedido.entity';

@Entity({ name: 'pedido' })
export class Pedido {
  @PrimaryGeneratedColumn({ name: 'pedidoId' })
  pedidoId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'userId' })
  user!: User;

  @Column()
  status!: string;

  @Column()
  enderecoEntrega!: string;

  @OneToMany(() => ItemPedido, (itemPedido) => itemPedido.pedido)
  itens!: ItemPedido[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}