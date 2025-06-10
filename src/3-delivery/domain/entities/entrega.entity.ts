import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { StatusEntrega } from '../enums/status-entrega.enum';
import { EnderecoVO } from '../value-objects/endereco.vo';

@Entity('entregas')
export class Entrega {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  pedidoId: string;

  @Column({ nullable: true })
  entregadorId: string;

  @Column({
    type: 'varchar',
    enum: StatusEntrega,
    default: StatusEntrega.PENDENTE
  })
  status: StatusEntrega;

  @Column('json', { nullable: true })
  enderecoColeta: EnderecoVO;

  @Column('json', { nullable: true })
  enderecoEntrega: EnderecoVO;

  @Column({ nullable: true })
  observacoes: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  valorFrete: number;

  @Column({ type: 'datetime', nullable: true })
  previsaoEntrega: Date;

  @Column({ type: 'datetime', nullable: true })
  dataRetirada: Date;

  @Column({ type: 'datetime', nullable: true })
  dataEntrega: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Métodos de negócio
  confirmarRetirada(): void {
    if (this.status !== StatusEntrega.PENDENTE) {
      throw new Error('Apenas entregas pendentes podem ser retiradas');
    }
    this.status = StatusEntrega.EM_ROTA;
    this.dataRetirada = new Date();
  }

  confirmarEntrega(): void {
    if (this.status !== StatusEntrega.EM_ROTA) {
      throw new Error('Apenas entregas em rota podem ser entregues');
    }
    this.status = StatusEntrega.ENTREGUE;
    this.dataEntrega = new Date();
  }

  cancelar(): void {
    if (this.status === StatusEntrega.ENTREGUE) {
      throw new Error('Não é possível cancelar uma entrega já realizada');
    }
    this.status = StatusEntrega.CANCELADA;
  }

  static criar(
    pedidoId: string,
    enderecoColeta: EnderecoVO,
    enderecoEntrega: EnderecoVO,
    valorFrete?: number
  ): Entrega {
    const entrega = new Entrega();
    entrega.pedidoId = pedidoId;
    entrega.enderecoColeta = enderecoColeta;
    entrega.enderecoEntrega = enderecoEntrega;
    entrega.valorFrete = valorFrete || 0;
    entrega.status = StatusEntrega.PENDENTE;
    entrega.previsaoEntrega = new Date(Date.now() + 60 * 60 * 1000); // 1 hora a partir de agora
    return entrega;
  }
}
