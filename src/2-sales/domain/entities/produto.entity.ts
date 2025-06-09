import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinColumn, JoinTable } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { AggregateRoot } from '../../../common/domain/aggregate-root.base';
import { Categoria } from './categoria.entity';
import { Estabelecimento } from './estabelecimento.entity';
import { Dinheiro } from '../value-objects/dinheiro.vo';
import { 
  ProdutoInvalidoError, 
  EstoqueInsuficienteError, 
  ProdutoInativoError,
  EstoqueCriticoError,
  ReservaEstoqueError,
  PrecoInvalidoError,
  UnidadeMedidaInvalidaError
} from '../errors/produto.errors';
import { 
  ProdutoEstoqueAlteradoEvent, 
  ProdutoEstoqueCriticoEvent,
  ProdutoPrecoAlteradoEvent,
  ProdutoCriadoEvent,
  ProdutoDesativadoEvent
} from '../events/produto.events';

export enum UnidadeMedida {
  UNIDADE = 'UNIDADE',
  KG = 'KG',
  LITRO = 'LITRO',
  GRAMA = 'GRAMA',
  METRO = 'METRO',
  PACOTE = 'PACOTE',
  CAIXA = 'CAIXA',
  DUZIA = 'DUZIA'
}

export enum StatusProduto {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  DESCONTINUADO = 'DESCONTINUADO',
  EM_ANALISE = 'EM_ANALISE'
}

export interface ReservaEstoque {
  id: string;
  quantidade: number;
  dataReserva: Date;
  motivoReserva: string;
  usuarioId?: string;
}

@Entity()
export class Produto extends BaseEntity {
  private _aggregateRoot: AggregateRoot = new (class extends AggregateRoot {})();

  @Column()
  nome: string;

  @Column('decimal', { precision: 10, scale: 2 })
  preco: number;

  @Column({ nullable: true })
  descricao: string;

  @Column({ nullable: true })
  imagemUrl: string;

  @Column({
    type: 'varchar',
    enum: StatusProduto,
    default: StatusProduto.ATIVO
  })
  status: StatusProduto;
  @Column({ default: true })
  disponivel: boolean;

  @Column({ default: true })
  ativo: boolean;

  @Column({ default: 0 })
  estoque: number;

  @Column({ default: 0 })
  estoqueReservado: number;

  @Column({ default: 0 })
  estoqueMinimo: number;

  @Column({
    type: 'varchar',
    enum: UnidadeMedida,
    default: UnidadeMedida.UNIDADE
  })
  unidadeMedida: UnidadeMedida;
  @Column({ nullable: true })
  partnerId: string;

  @Column({ default: 0 })
  totalVendas: number;

  @Column('decimal', { precision: 3, scale: 1, default: 0 })
  avaliacaoMedia: number;

  @Column({ default: 0 })
  totalAvaliacoes: number;

  @Column({ nullable: true })
  codigoBarras: string;

  @Column('decimal', { precision: 8, scale: 3, nullable: true })
  peso: number; // em gramas

  @Column('text', { nullable: true })
  ingredientes: string;

  @Column({ nullable: true })
  origem: string;

  @Column({ nullable: true })
  dataValidade: Date;

  @Column({ default: false })
  promocional: boolean;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  precoPromocional: number;

  @Column({ nullable: true })
  inicioPromocao: Date;

  @Column({ nullable: true })
  fimPromocao: Date;

  // Controle de histórico
  @Column({ nullable: true })
  ultimaAtualizacaoEstoque: Date;

  @Column({ nullable: true })
  ultimaAtualizacaoPreco: Date;

  @Column({ nullable: true })
  criadoPor: string;
  @Column({ nullable: true })
  atualizadoPor: string;

  // Relacionamento Many-to-Many com Categoria
  @ManyToMany(() => Categoria, categoria => categoria.produtos)
  @JoinTable({
    name: 'produto_categoria',
    joinColumn: { name: 'produtoId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'categoriaId', referencedColumnName: 'id' }
  })
  categorias: Categoria[];

  // Relacionamento Many-to-One com Estabelecimento
  @ManyToOne(() => Estabelecimento, estabelecimento => estabelecimento.produtos)
  @JoinColumn({ name: 'estabelecimentoId' })
  estabelecimento: Estabelecimento;

  @Column({ nullable: true })
  estabelecimentoId: string;

  // ===== MÉTODOS DE NEGÓCIO (RICH DOMAIN) =====

  static criar(dados: {
    nome: string;
    preco: number;
    descricao?: string;
    unidadeMedida: UnidadeMedida;
    estoque: number;
    estoqueMinimo: number;
    estabelecimentoId: string;
    categorias?: Categoria[];
  }): Produto {
    const produto = new Produto();
    produto.validarDadosObrigatorios(dados);
    
    produto.nome = dados.nome.trim();
    produto.preco = dados.preco;
    produto.descricao = dados.descricao?.trim() || '';
    produto.unidadeMedida = dados.unidadeMedida;
    produto.estoque = dados.estoque;
    produto.estoqueMinimo = dados.estoqueMinimo;
    produto.estabelecimentoId = dados.estabelecimentoId;
    produto.categorias = dados.categorias || [];
    produto.ativo = true;
    produto.disponivel = true;
    produto.estoqueReservado = 0;
    produto.totalVendas = 0;
    produto.avaliacaoMedia = 0;
    produto.totalAvaliacoes = 0;

    return produto;
  }

  private validarDadosObrigatorios(dados: any): void {
    if (!dados.nome?.trim()) {
      throw new ProdutoInvalidoError('Nome do produto é obrigatório');
    }
    if (dados.preco <= 0) {
      throw new ProdutoInvalidoError('Preço deve ser maior que zero');
    }
    if (dados.estoque < 0) {
      throw new ProdutoInvalidoError('Estoque não pode ser negativo');
    }
    if (dados.estoqueMinimo < 0) {
      throw new ProdutoInvalidoError('Estoque mínimo não pode ser negativo');
    }
    if (!dados.estabelecimentoId) {
      throw new ProdutoInvalidoError('Estabelecimento é obrigatório');
    }
  }

  // Gestão de Estoque
  reservarEstoque(quantidade: number): void {
    this.validarDisponibilidade();
    
    if (quantidade <= 0) {
      throw new ProdutoInvalidoError('Quantidade deve ser maior que zero');
    }

    const estoqueDisponivel = this.getEstoqueDisponivel();    if (quantidade > estoqueDisponivel) {
      throw new EstoqueInsuficienteError(estoqueDisponivel, quantidade, this.nome);
    }

    this.estoqueReservado += quantidade;
  }

  confirmarVenda(quantidade: number): void {
    if (quantidade > this.estoqueReservado) {
      throw new ProdutoInvalidoError('Quantidade excede estoque reservado');
    }

    this.estoque -= quantidade;
    this.estoqueReservado -= quantidade;
    this.totalVendas += quantidade;

    if (this.estoque <= this.estoqueMinimo) {
      this.disponivel = false;
    }
  }

  cancelarReserva(quantidade: number): void {
    if (quantidade > this.estoqueReservado) {
      throw new ProdutoInvalidoError('Quantidade excede estoque reservado');
    }

    this.estoqueReservado -= quantidade;
  }

  reporEstoque(quantidade: number): void {
    if (quantidade <= 0) {
      throw new ProdutoInvalidoError('Quantidade deve ser maior que zero');
    }

    this.estoque += quantidade;
    
    if (this.estoque > this.estoqueMinimo && this.ativo) {
      this.disponivel = true;
    }
  }

  // Gestão de Status
  ativar(): void {
    this.ativo = true;
    if (this.estoque > this.estoqueMinimo) {
      this.disponivel = true;
    }
  }

  desativar(): void {
    this.ativo = false;
    this.disponivel = false;
  }

  marcarComoIndisponivel(): void {
    this.disponivel = false;
  }

  marcarComoDisponivel(): void {
    if (!this.ativo) {
      throw new ProdutoInativoError('Produto inativo não pode ser marcado como disponível');
    }    if (this.estoque <= this.estoqueMinimo) {
      throw new EstoqueInsuficienteError(this.estoque, this.estoqueMinimo + 1, this.nome);
    }
    this.disponivel = true;
  }

  // Gestão de Preço
  alterarPreco(novoPreco: number): void {
    if (novoPreco <= 0) {
      throw new ProdutoInvalidoError('Preço deve ser maior que zero');
    }
    this.preco = novoPreco;
  }

  aplicarDesconto(percentual: number): number {
    if (percentual < 0 || percentual > 100) {
      throw new ProdutoInvalidoError('Percentual de desconto deve estar entre 0 e 100');
    }
    return this.preco * (1 - percentual / 100);
  }

  // Gestão de Avaliações
  adicionarAvaliacao(nota: number): void {
    if (nota < 1 || nota > 5) {
      throw new ProdutoInvalidoError('Nota deve estar entre 1 e 5');
    }

    const novaMedia = (this.avaliacaoMedia * this.totalAvaliacoes + nota) / (this.totalAvaliacoes + 1);
    this.avaliacaoMedia = Math.round(novaMedia * 10) / 10; // Uma casa decimal
    this.totalAvaliacoes += 1;
  }

  // Getters de Negócio
  getEstoqueDisponivel(): number {
    return Math.max(0, this.estoque - this.estoqueReservado);
  }

  getPreco(): Dinheiro {
    return Dinheiro.criar(this.preco);
  }

  ehDisponivel(): boolean {
    return this.ativo && this.disponivel && this.getEstoqueDisponivel() > 0;
  }

  precisaReposicao(): boolean {
    return this.estoque <= this.estoqueMinimo;
  }

  temEstoqueCritico(): boolean {
    return this.estoque <= (this.estoqueMinimo * 0.5);
  }

  ehBemAvaliado(): boolean {
    return this.avaliacaoMedia >= 4.0 && this.totalAvaliacoes >= 5;
  }

  ehBestSeller(): boolean {
    return this.totalVendas >= 100;
  }

  // Validações
  private validarDisponibilidade(): void {
    if (!this.ativo) {
      throw new ProdutoInativoError('Produto está inativo');
    }
    if (!this.disponivel) {
      throw new ProdutoInvalidoError('Produto não está disponível');
    }
  }

  // Categorias
  adicionarCategoria(categoria: Categoria): void {
    if (!this.categorias) {
      this.categorias = [];
    }
    
    const jaExiste = this.categorias.some(c => c.id === categoria.id);
    if (!jaExiste) {
      this.categorias.push(categoria);
    }
  }

  removerCategoria(categoriaId: string): void {
    if (this.categorias) {
      this.categorias = this.categorias.filter(c => c.id !== categoriaId);
    }
  }

  pertenceCategoria(categoriaId: string): boolean {
    return this.categorias?.some(c => c.id === categoriaId) || false;
  }

  // Métodos de Factory
  static criarProdutoBasico(nome: string, preco: number, estabelecimentoId: string): Produto {
    return this.criar({
      nome,
      preco,
      unidadeMedida: UnidadeMedida.UNIDADE,
      estoque: 0,
      estoqueMinimo: 5,
      estabelecimentoId
    });
  }
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
  // ===== DOMAIN EVENTS MANAGEMENT =====
  
  /**
   * Gets all uncommitted domain events
   */
  getUncommittedEvents(): any[] {
    return this._aggregateRoot.getUncommittedEvents();
  }

  /**
   * Marks all domain events as committed
   */
  markEventsAsCommitted(): void {
    this._aggregateRoot.markEventsAsCommitted();
  }

  /**
   * Adds a domain event to the aggregate
   */
  private addDomainEvent(domainEvent: any): void {
    (this._aggregateRoot as any).addDomainEvent(domainEvent);
  }

  /**
   * Clears all domain events
   */
  private clearDomainEvents(): void {
    (this._aggregateRoot as any).clearDomainEvents();
  }
}
