import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'pagamento' })
export class Pagamento {
  @PrimaryGeneratedColumn({ name: 'pagamentoId' })
  pagamentoId!: number;

  @Column()
  pedidoId!: number;

  @Column()
  valor!: number;

  @Column()
  status!: string;

  @Column({ nullable: true })
  stripePaymentIntentId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}