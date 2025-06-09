import { Entity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { StatusPagamento } from '../enums/status-pagamento.enum';

@Entity('pagamentos')
export class Pagamento extends BaseEntity {
  @Column()
  pedidoId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  valor: number;

  @Column({
    type: 'varchar',
    enum: StatusPagamento,
    default: StatusPagamento.PENDENTE
  })
  status: StatusPagamento;

  @Column({ nullable: true })
  stripeSessionId: string; // ID da sessão no Stripe

  @Column({ nullable: true })
  stripePaymentIntentId: string; // ID do payment intent no Stripe

  @Column({ nullable: true })
  metodoPagamento: string; // card, pix, etc

  @Column({ nullable: true })
  gatewayResponse: string; // JSON com resposta completa do gateway

  @Column({ nullable: true })
  dataProcessamento: Date;

  @Column({ nullable: true })
  motivoRecusa: string;

  // Métodos de negócio
  aprovar(): void {
    if (this.status !== StatusPagamento.PENDENTE) {
      throw new Error('Apenas pagamentos pendentes podem ser aprovados');
    }
    this.status = StatusPagamento.APROVADO;
    this.dataProcessamento = new Date();
  }
  recusar(motivo?: string): void {
    if (this.status !== StatusPagamento.PENDENTE) {
      throw new Error('Apenas pagamentos pendentes podem ser recusados');
    }
    this.status = StatusPagamento.RECUSADO;
    this.motivoRecusa = motivo || 'Motivo não informado';
    this.dataProcessamento = new Date();
  }

  estornar(): void {
    if (this.status !== StatusPagamento.APROVADO) {
      throw new Error('Apenas pagamentos aprovados podem ser estornados');
    }
    this.status = StatusPagamento.ESTORNADO;
  }

  static criar(pedidoId: string, valor: number): Pagamento {
    const pagamento = new Pagamento();
    pagamento.pedidoId = pedidoId;
    pagamento.valor = valor;
    pagamento.status = StatusPagamento.PENDENTE;
    return pagamento;
  }
}
