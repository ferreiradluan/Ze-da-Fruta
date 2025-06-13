import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { StatusPagamento } from '../enums/status-pagamento.enum';
import { Dinheiro } from '../value-objects/dinheiro.value-object';

/**
 * Entidade Pagamento - Modelo de Domínio Rico
 *
 * Responsabilidades:
 * - Gerenciar o ciclo de vida do pagamento
 * - Validar transições de estado
 * - Encapsular regras de negócio de pagamento
 */
@Entity('pagamentos')
export class Pagamento extends BaseEntity {
  @Column({ type: 'varchar', length: 36 })
  pedidoId!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  private _valor!: number;

  @Column({
    type: 'varchar',
    enum: StatusPagamento,
    default: StatusPagamento.PENDENTE
  })
  status!: StatusPagamento;

  @Column({ type: 'varchar', default: 'stripe' })
  provedor!: string;

  @Column({ type: 'varchar', nullable: true })
  stripeSessionId?: string;

  @Column({ type: 'varchar', nullable: true })
  stripePaymentIntentId?: string;

  @Column({ type: 'varchar', nullable: true })
  metodoPagamento?: string;

  @Column({ type: 'text', nullable: true })
  gatewayResponse?: string;

  @Column({ type: 'timestamp', nullable: true })
  dataProcessamento?: Date;

  @Column({ type: 'text', nullable: true })
  motivoRecusa?: string;

  // Getter para valor como Value Object
  get valor(): Dinheiro {
    return Dinheiro.criar(this._valor);
  }

  // Setter para valor
  set valor(dinheiro: Dinheiro) {
    this._valor = dinheiro.valor;
  }

  // ===================================
  // MÉTODOS DE NEGÓCIO (DOMAIN RICH MODEL)
  // ===================================

  /**
   * Confirma o pagamento
   * Transição: PENDENTE → APROVADO
   */
  confirmar(): void {
    if (this.status !== StatusPagamento.PENDENTE) {
      throw new Error('Apenas pagamentos pendentes podem ser confirmados');
    }

    this.status = StatusPagamento.APROVADO;
    this.dataProcessamento = new Date();
  }

  /**
   * Falha o pagamento
   * Transição: PENDENTE → RECUSADO
   */
  falhar(motivo: string): void {
    if (this.status !== StatusPagamento.PENDENTE) {
      throw new Error('Apenas pagamentos pendentes podem falhar');
    }

    this.status = StatusPagamento.RECUSADO;
    this.motivoRecusa = motivo;
    this.dataProcessamento = new Date();
  }

  /**
   * Reembolsa o pagamento (total ou parcial)
   * Transição: APROVADO → ESTORNADO | PARCIALMENTE_REEMBOLSADO
   */
  reembolsar(valorParcial?: Dinheiro): void {
    if (this.status !== StatusPagamento.APROVADO) {
      throw new Error('Apenas pagamentos aprovados podem ser reembolsados');
    }

    if (valorParcial) {
      if (valorParcial.valor >= this._valor) {
        throw new Error('Valor do reembolso parcial não pode ser maior ou igual ao valor total');
      }
      this.status = StatusPagamento.PARCIALMENTE_REEMBOLSADO;
    } else {
      this.status = StatusPagamento.ESTORNADO;
    }

    this.dataProcessamento = new Date();
  }

  /**
   * Verifica se o pagamento está completo (aprovado)
   */
  estaCompleto(): boolean {
    return this.status === StatusPagamento.APROVADO;
  }

  /**
   * Verifica se o pagamento pode ser cancelado
   */
  podeSerCancelado(): boolean {
    return this.status === StatusPagamento.PENDENTE;
  }

  /**
   * Verifica se o pagamento pode ser reembolsado
   */
  podeSerReembolsado(): boolean {
    return this.status === StatusPagamento.APROVADO ||
      this.status === StatusPagamento.PARCIALMENTE_REEMBOLSADO;
  }

  /**
   * Atualiza dados do gateway (Stripe)
   */
  atualizarDadosGateway(sessionId?: string, paymentIntentId?: string, metodoPagamento?: string, response?: any): void {
    if (sessionId) {
      this.stripeSessionId = sessionId;
    }

    if (paymentIntentId) {
      this.stripePaymentIntentId = paymentIntentId;
    }

    if (metodoPagamento) {
      this.metodoPagamento = metodoPagamento;
    }

    if (response) {
      this.gatewayResponse = JSON.stringify(response);
    }
  }

  // ===================================
  // MÉTODOS ESTÁTICOS (FACTORY)
  // ===================================

  /**
   * Factory method para criar um novo pagamento
   */
  static criar(pedidoId: string, valor: number): Pagamento {
    if (!pedidoId) {
      throw new Error('ID do pedido é obrigatório');
    }

    if (valor <= 0) {
      throw new Error('Valor deve ser maior que zero');
    }

    const pagamento = new Pagamento();
    pagamento.pedidoId = pedidoId;
    pagamento._valor = valor;
    pagamento.status = StatusPagamento.PENDENTE;
    pagamento.provedor = 'stripe';

    return pagamento;
  }
}
