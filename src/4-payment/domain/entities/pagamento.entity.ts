import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { StatusPagamento } from '../value-objects/status-pagamento.vo';
import { Dinheiro } from '../value-objects/dinheiro.vo';
import { StatusPagamentoTransformer } from '../../infrastructure/transformers/status-pagamento.transformer';
import { DinheiroTransformer } from '../../infrastructure/transformers/dinheiro.transformer';

@Entity('pagamentos')
export class Pagamento {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'pedido_id' })
  pedidoId!: string;

  @Column({ 
    type: 'varchar', 
    transformer: new DinheiroTransformer() 
  })
  valor!: Dinheiro;

  @Column({ 
    type: 'varchar', 
    length: 50,
    transformer: new StatusPagamentoTransformer() 
  })
  status!: StatusPagamento;

  @Column({ type: 'varchar', length: 100, default: 'stripe' })
  provedor!: string;

  @Column({ 
    type: 'varchar', 
    length: 255, 
    nullable: true,
    name: 'id_transacao_externa' 
  })
  idTransacaoExterna?: string;

  // ===================================
  // FACTORY METHOD (DDD Pattern)
  // ===================================
  public static criar(dados: {
    pedidoId: string;
    valor: Dinheiro;
    provedor?: string;
    idTransacaoExterna?: string;
  }): Pagamento {
    const pagamento = new Pagamento();
    pagamento.pedidoId = dados.pedidoId;
    pagamento.valor = dados.valor;
    pagamento.status = StatusPagamento.PENDENTE;
    pagamento.provedor = dados.provedor || 'stripe';
    pagamento.idTransacaoExterna = dados.idTransacaoExterna;
    return pagamento;
  }

  // ===================================
  // MÉTODOS DE NEGÓCIO (Rich Domain Model)
  // ===================================
  public confirmar(): void {
    if (!this.status.podeSerConfirmado()) {
      throw new Error(`Não é possível confirmar pagamento com status ${this.status.valor}`);
    }
    this.status = StatusPagamento.SUCESSO;
  }

  public falhar(motivo?: string): void {
    if (!this.status.podeSerConfirmado()) {
      throw new Error(`Não é possível falhar pagamento com status ${this.status.valor}`);
    }
    this.status = StatusPagamento.FALHOU;
  }

  public reembolsar(valorParcial?: Dinheiro): void {
    if (!this.status.podeSerReembolsado()) {
      throw new Error(`Não é possível reembolsar pagamento com status ${this.status.valor}`);
    }

    if (valorParcial && valorParcial.valor < this.valor.valor) {
      this.status = StatusPagamento.PARCIALMENTE_REEMBOLSADO;
    } else {
      this.status = StatusPagamento.REEMBOLSADO;
    }
  }

  public estaCompleto(): boolean {
    return this.status.estaConcluido();
  }

  // ===================================
  // GETTERS (Encapsulamento)
  // ===================================
  public obterStatus(): StatusPagamento {
    return this.status;
  }

  public obterValor(): Dinheiro {
    return this.valor;
  }
}
