import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinColumn, JoinTable } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { Categoria } from './categoria.entity';
import { Estabelecimento } from './estabelecimento.entity';
import { Dinheiro } from '../value-objects/dinheiro.vo';
import { ProdutoEstoqueAtualizadoEvent, ProdutoStatusAtualizadoEvent } from '../events/produto.events';
import { DomainEvent } from '../../../common/domain/events/domain-event';

@Entity()
export class Produto extends BaseEntity {
  @Column()
  nome!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  preco!: number; // Mantendo como number por simplicidade com TypeORM

  @Column({ nullable: true })
  descricao?: string;

  @Column({ nullable: true })
  imagemUrl?: string;

  @Column({ default: true })
  ativo!: boolean;

  @Column({ default: true })
  disponivel!: boolean;

  @Column({ default: 0 })
  estoque!: number;

  @Column({ nullable: true })
  unidadeMedida?: string; // kg, unidade, litro, etc.

  @Column({ nullable: true })
  partnerId?: string;

  // Relacionamento Many-to-Many com Categoria
  @ManyToMany(() => Categoria, categoria => categoria.produtos)
  @JoinTable({
    name: 'produto_categoria',
    joinColumn: { name: 'produtoId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'categoriaId', referencedColumnName: 'id' }
  })
  categorias!: Categoria[];

  // Relacionamento Many-to-One com Estabelecimento
  @ManyToOne(() => Estabelecimento, estabelecimento => estabelecimento.produtos)
  @JoinColumn({ name: 'estabelecimentoId' })
  estabelecimento?: Estabelecimento;
  @Column({ nullable: true })
  estabelecimentoId?: string;

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

  // Método para obter preço como Value Object
  getPreco(): Dinheiro {
    return Dinheiro.criar(this.preco);
  }

  // Método para definir preço a partir do Value Object
  setPreco(dinheiro: Dinheiro): void {
    this.preco = dinheiro.valor;
  }

  // Métodos de Negócio
  estaDisponivel(): boolean {
    return this.ativo && this.disponivel && this.estoque > 0;
  }

  temEstoqueSuficiente(quantidade: number): boolean {
    return this.estoque >= quantidade;
  }

  reduzirEstoque(quantidade: number): void {
    if (!this.temEstoqueSuficiente(quantidade)) {
      throw new Error(`Estoque insuficiente. Disponível: ${this.estoque}, solicitado: ${quantidade}`);
    }
    this.estoque -= quantidade;
  }

  aumentarEstoque(quantidade: number): void {
    if (quantidade <= 0) {
      throw new Error('Quantidade deve ser maior que zero');
    }
    this.estoque += quantidade;
  }

  atualizarPreco(novoPreco: Dinheiro): void {
    if (novoPreco.valor <= 0) {
      throw new Error('Preço deve ser maior que zero');
    }
    this.preco = novoPreco.valor;
  }

  // ===== MÉTODOS DE NEGÓCIO ENRIQUECIDOS =====
  ativar(): void {
    if (this.ativo) {
      throw new Error('Produto já está ativo');
    }
    
    this.ativo = true;

    // Disparar evento de ativação
    this.addDomainEvent(new ProdutoStatusAtualizadoEvent(
      this.id,
      true
    ));
  }

  desativar(): void {
    if (!this.ativo) {
      throw new Error('Produto já está inativo');
    }
    
    this.ativo = false;
    this.disponivel = false; // Ao desativar, também fica indisponível

    // Disparar evento de desativação
    this.addDomainEvent(new ProdutoStatusAtualizadoEvent(
      this.id,
      false
    ));
  }
  atualizarEstoque(quantidade: number): void {
    if (quantidade < 0) {
      throw new Error('Quantidade em estoque não pode ser negativa');
    }
    
    const estoqueAnterior = this.estoque;
    this.estoque = quantidade;
    
    // Se estoque zerou, marcar como indisponível
    if (this.estoque === 0) {
      this.disponivel = false;
    }

    // Disparar evento de atualização de estoque
    this.addDomainEvent(new ProdutoEstoqueAtualizadoEvent(
      this.id,
      estoqueAnterior,
      quantidade,
      'ajuste'
    ));
  }
  reservarEstoque(quantidade: number): void {
    if (!this.temEstoqueSuficiente(quantidade)) {
      throw new Error(`Não é possível reservar ${quantidade} unidades. Estoque disponível: ${this.estoque}`);
    }
    
    if (!this.estaDisponivel()) {
      throw new Error('Produto não está disponível para reserva');
    }

    const estoqueAnterior = this.estoque;
    this.estoque -= quantidade;
    
    // Se estoque zerou após reserva, marcar como indisponível
    if (this.estoque === 0) {
      this.disponivel = false;
    }

    // Disparar evento de reserva de estoque
    this.addDomainEvent(new ProdutoEstoqueAtualizadoEvent(
      this.id,
      estoqueAnterior,
      this.estoque,
      'reserva'
    ));
  }
  liberarEstoque(quantidade: number): void {
    if (quantidade <= 0) {
      throw new Error('Quantidade a liberar deve ser maior que zero');
    }
    
    const estoqueAnterior = this.estoque;
    this.estoque += quantidade;
    
    // Se tinha estoque zero e agora tem, marcar como disponível (se produto estiver ativo)
    if (this.estoque > 0 && this.ativo) {
      this.disponivel = true;
    }

    // Disparar evento de liberação de estoque
    this.addDomainEvent(new ProdutoEstoqueAtualizadoEvent(
      this.id,
      estoqueAnterior,
      this.estoque,
      'liberacao'
    ));
  }
  podeSerVendido(): boolean {
    return this.ativo && 
           this.disponivel && 
           this.estoque > 0 && 
           this.preco > 0 &&
           (this.estabelecimento?.podeVender() ?? true); // Se não há estabelecimento, assume true
  }

  marcarComoDisponivel(): void {
    if (!this.ativo) {
      throw new Error('Produto inativo não pode ser marcado como disponível');
    }
    
    if (this.estoque <= 0) {
      throw new Error('Produto sem estoque não pode ser marcado como disponível');
    }
    
    this.disponivel = true;
  }

  marcarComoIndisponivel(): void {
    this.disponivel = false;
  }
  // ===== VALIDAÇÕES DE NEGÓCIO =====

  validarParaVenda(): { valido: boolean; motivos: string[] } {
    const motivos: string[] = [];

    if (!this.ativo) {
      motivos.push('Produto está inativo');
    }

    if (!this.disponivel) {
      motivos.push('Produto não está disponível');
    }

    if (this.estoque <= 0) {
      motivos.push('Produto sem estoque');
    }

    if (this.preco <= 0) {
      motivos.push('Preço deve ser maior que zero');
    }

    if (this.estabelecimento && !this.estabelecimento.podeVender()) {
      motivos.push('Estabelecimento não pode vender no momento');
    }

    return {
      valido: motivos.length === 0,
      motivos
    };
  }

  validarEstoque(quantidadeSolicitada: number): void {
    if (quantidadeSolicitada <= 0) {
      throw new Error('Quantidade solicitada deve ser maior que zero');
    }

    if (!this.temEstoqueSuficiente(quantidadeSolicitada)) {
      throw new Error(`Estoque insuficiente. Disponível: ${this.estoque}, solicitado: ${quantidadeSolicitada}`);
    }
  }

  calcularValorTotal(quantidade: number): Dinheiro {
    this.validarEstoque(quantidade);
    return this.getPreco().multiplicar(quantidade);
  }
}
