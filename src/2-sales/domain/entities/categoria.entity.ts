import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { Produto } from './produto.entity';
import { Estabelecimento } from './estabelecimento.entity';
import { DomainEvent } from '../../../common/domain/events/domain-event';

@Entity()
export class Categoria extends BaseEntity {
  @Column()
  nome!: string;

  @Column({ nullable: true })
  descricao?: string;

  @Column({ default: true })
  ativo: boolean = true;

  @Column({ nullable: true })
  estabelecimentoId?: string;

  @ManyToOne(() => Estabelecimento)
  @JoinColumn({ name: 'estabelecimentoId' })
  estabelecimento?: Estabelecimento;

  @ManyToMany(() => Produto, produto => produto.categorias)
  produtos: Produto[] = [];

  // ===== DOMAIN EVENTS =====
  private domainEvents: DomainEvent[] = [];

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  // ===== FACTORY METHODS =====
  static criarNova(dados: any): Categoria {
    const categoria = new Categoria();
    categoria.nome = dados.nome;
    categoria.descricao = dados.descricao;
    categoria.ativo = true;
    categoria.estabelecimentoId = dados.estabelecimentoId;
    
    return categoria;
  }

  // ===== MÉTODOS DE NEGÓCIO =====
  ativar(): void {
    if (this.ativo) {
      throw new Error('Categoria já está ativa');
    }
    this.ativo = true;
  }

  desativar(): void {
    if (!this.ativo) {
      throw new Error('Categoria já está inativa');
    }
    this.ativo = false;
  }

  atualizarDados(dados: Partial<{ nome: string; descricao: string }>): void {
    if (dados.nome) {
      this.validarNome(dados.nome);
      this.nome = dados.nome;
    }
    
    if (dados.descricao !== undefined) {
      this.descricao = dados.descricao;
    }
  }

  // ===== VALIDAÇÕES =====
  private validarNome(nome: string): void {
    if (!nome || nome.trim().length === 0) {
      throw new Error('Nome da categoria é obrigatório');
    }
    
    if (nome.length < 2) {
      throw new Error('Nome da categoria deve ter pelo menos 2 caracteres');
    }
    
    if (nome.length > 50) {
      throw new Error('Nome da categoria não pode ter mais que 50 caracteres');
    }
  }

  // ===== MÉTODOS DE CONSULTA =====
  temProdutos(): boolean {
    return this.produtos && this.produtos.length > 0;
  }

  contarProdutos(): number {
    return this.produtos ? this.produtos.length : 0;
  }

  estaAtiva(): boolean {
    return this.ativo;
  }
}
