import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'entrega' })
export class Entrega {
  @PrimaryGeneratedColumn({ name: 'entregaId' })
  entregaId!: number;

  @Column()
  pedidoId!: number;

  @Column()
  status!: string;

  @Column()
  dataEntrega!: Date;
}