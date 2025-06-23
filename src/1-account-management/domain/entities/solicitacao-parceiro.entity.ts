import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { BusinessRuleViolationException } from '../../../common/exceptions/business-rule-violation.exception';
import { TIPO_SOLICITACAO } from '../types/tipo-solicitacao.types';
import { STATUS_SOLICITACAO } from '../types/status-solicitacao.types';

/**
 * Solicitação de Parceiro (Lojista ou Entregador)
 * Entidade de domínio para controlar o onboarding de parceiros
 */
@Entity('solicitacoes_parceiro')
export class SolicitacaoParceiro extends BaseEntity {
  @Column('varchar', { length: 255 })
  email!: string;

  @Column('text')
  dados!: any; // JSON stored as text for SQLite compatibility

  @Column('varchar', { length: 50 })
  tipo!: string;

  @Column('varchar', { length: 50, default: 'PENDENTE' })
  status!: string;

  // Métodos de negócio (Domínio Rico)
  static criarSolicitacaoLojista(dados: {
    email: string;
    nome: string;
    telefone: string;
    cpf: string;
    nomeEstabelecimento: string;
    cnpj: string;    descricaoNegocio: string;
    endereco: any;
    observacoes?: string;
  }): SolicitacaoParceiro {
    const solicitacao = new SolicitacaoParceiro();
    solicitacao.email = dados.email;    solicitacao.tipo = TIPO_SOLICITACAO.LOJISTA;
    solicitacao.status = STATUS_SOLICITACAO.PENDENTE;
    solicitacao.dados = dados;
    return solicitacao;
  }

  static criarSolicitacaoEntregador(dados: {
    email: string;
    nome: string;
    telefone: string;
    cpf: string;
    tipoVeiculo: string;
    modeloVeiculo: string;
    placaVeiculo: string;    numeroCNH: string;
    endereco: any;
    observacoes?: string;
  }): SolicitacaoParceiro {
    const solicitacao = new SolicitacaoParceiro();
    solicitacao.email = dados.email;    solicitacao.tipo = TIPO_SOLICITACAO.ENTREGADOR;
    solicitacao.status = STATUS_SOLICITACAO.PENDENTE;
    solicitacao.dados = dados;
    return solicitacao;
  }
  aprovar(aprovadoPor?: string): void {
    if (this.status !== STATUS_SOLICITACAO.PENDENTE && this.status !== STATUS_SOLICITACAO.EM_ANALISE) {
      throw new BusinessRuleViolationException('Apenas solicitações pendentes ou em análise podem ser aprovadas');
    }
    this.status = STATUS_SOLICITACAO.APROVADA;
  }

  rejeitar(rejeitadoPor?: string, motivo?: string): void {
    if (this.status !== STATUS_SOLICITACAO.PENDENTE && this.status !== STATUS_SOLICITACAO.EM_ANALISE) {
      throw new BusinessRuleViolationException('Apenas solicitações pendentes ou em análise podem ser rejeitadas');
    }
    this.status = STATUS_SOLICITACAO.REJEITADA;
  }

  marcarComoEmAnalise(): void {
    if (this.status !== STATUS_SOLICITACAO.PENDENTE) {
      throw new BusinessRuleViolationException('Apenas solicitações pendentes podem ser colocadas em análise');
    }
    this.status = STATUS_SOLICITACAO.EM_ANALISE;
  }
}
