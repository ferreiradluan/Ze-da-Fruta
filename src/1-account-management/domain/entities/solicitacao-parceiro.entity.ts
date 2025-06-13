import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';

@Entity('solicitacoes_parceiro')
export class SolicitacaoParceiro extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  nome: string;

  @Column({ type: 'varchar' })
  telefone: string;

  @Column({ type: 'varchar' })
  cpf: string;

  @Column({ type: 'json' })
  dados: Record<string, any>;

  @Column({ type: 'varchar' })
  tipo: string; // 'LOJISTA' | 'ENTREGADOR'

  @Column({ type: 'varchar', default: 'PENDENTE' })
  status: string; // 'PENDENTE' | 'APROVADO' | 'REJEITADO'

  @Column({ type: 'timestamp', nullable: true })
  dataProcessamento?: Date;

  @Column({ type: 'text', nullable: true })
  observacoes?: string;

  @Column({ type: 'varchar', nullable: true })
  motivoRejeicao?: string;

  // === MÉTODOS DE DOMÍNIO RICO ===

  isPendente(): boolean {
    return this.status === 'PENDENTE';
  }

  isAprovado(): boolean {
    return this.status === 'APROVADO';
  }

  isRejeitado(): boolean {
    return this.status === 'REJEITADO';
  }

  aprovar(observacoes?: string): void {
    if (!this.isPendente()) {
      throw new Error('Somente solicitações pendentes podem ser aprovadas');
    }
    this.status = 'APROVADO';
    this.dataProcessamento = new Date();
    if (observacoes) {
      this.observacoes = observacoes;
    }
  }

  rejeitar(motivo: string): void {
    if (!this.isPendente()) {
      throw new Error('Somente solicitações pendentes podem ser rejeitadas');
    }
    this.status = 'REJEITADO';
    this.dataProcessamento = new Date();
    this.motivoRejeicao = motivo;
  }

  isLojista(): boolean {
    return this.tipo === 'LOJISTA';
  }

  isEntregador(): boolean {
    return this.tipo === 'ENTREGADOR';
  }

  podeSerProcessada(): boolean {
    return this.isPendente();
  }
}