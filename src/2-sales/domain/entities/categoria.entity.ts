import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { AggregateRoot } from '../../../common/domain/aggregate-root.base';
import { Produto } from './produto.entity';
import { 
  CategoriaInvalidaError,
  CategoriaNaoEncontradaError,  CategoriaJaExisteError
} from '../errors';
import { 
  CategoriaCriadaEvent,
  CategoriaDesativadaEvent,
  CategoriaAtualizadaEvent,
  CategoriaProdutoAdicionadoEvent,
  CategoriaProdutoRemovidoEvent
} from '../events';

@Entity()
export class Categoria extends BaseEntity {
  private _aggregateRoot: AggregateRoot = new (class extends AggregateRoot {})(this.id || '');

  @Column()
  nome: string;
  @Column({ nullable: true })
  descricao: string | null;

  @Column({ default: true })
  ativo: boolean;
  @Column({ nullable: true })
  imagemUrl: string | null;

  @Column({ nullable: true })
  corHex: string | null; // Cor da categoria para UI (#FF5733)

  @Column({ default: 0 })
  ordem: number; // Ordem de exibição
  @Column({ nullable: true })
  estabelecimentoId: string | null;

  @Column({ default: 0 })
  totalProdutos: number;

  @Column({ default: 0 })
  totalProdutosAtivos: number;

  @ManyToMany(() => Produto, produto => produto.categorias)
  produtos: Produto[];

  // ===== MÉTODOS DE NEGÓCIO (RICH DOMAIN) =====

  static criar(dados: {
    nome: string;
    descricao?: string;
    estabelecimentoId?: string;
    corHex?: string;
    ordem?: number;
  }): Categoria {
    const categoria = new Categoria();
    categoria.validarDadosObrigatorios(dados);
      categoria.nome = dados.nome.trim();
    categoria.descricao = dados.descricao?.trim() || null;
    categoria.estabelecimentoId = dados.estabelecimentoId || null;
    categoria.corHex = dados.corHex || null;
    categoria.ordem = dados.ordem || 0;
    categoria.ativo = true;
    categoria.totalProdutos = 0;
    categoria.totalProdutosAtivos = 0;
    categoria.produtos = [];

    return categoria;
  }

  private validarDadosObrigatorios(dados: any): void {
    if (!dados.nome?.trim()) {
      throw new CategoriaInvalidaError('Nome da categoria é obrigatório');
    }
    
    if (dados.nome.length < 2) {
      throw new CategoriaInvalidaError('Nome da categoria deve ter pelo menos 2 caracteres');
    }

    if (dados.nome.length > 50) {
      throw new CategoriaInvalidaError('Nome da categoria não pode ter mais de 50 caracteres');
    }

    if (dados.corHex && !this.isValidHexColor(dados.corHex)) {
      throw new CategoriaInvalidaError('Cor deve estar no formato hexadecimal válido (#RRGGBB)');
    }
  }

  private isValidHexColor(hex: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(hex);
  }

  // Gestão de Status
  ativar(): void {
    if (this.ativo) {
      throw new CategoriaInvalidaError('Categoria já está ativa');
    }
    this.ativo = true;
  }

  desativar(): void {
    if (!this.ativo) {
      throw new CategoriaInvalidaError('Categoria já está inativa');
    }
    
    if (this.totalProdutosAtivos > 0) {
      throw new CategoriaInvalidaError('Não é possível desativar categoria com produtos ativos');
    }
    
    this.ativo = false;
  }

  // Gestão de Produtos
  adicionarProduto(produto: Produto): void {
    if (!this.ativo) {
      throw new CategoriaInvalidaError('Não é possível adicionar produtos a uma categoria inativa');
    }

    if (!this.produtos) {
      this.produtos = [];
    }

    const jaExiste = this.produtos.some(p => p.id === produto.id);
    if (jaExiste) {
      throw new CategoriaInvalidaError('Produto já está associado a esta categoria');
    }

    this.produtos.push(produto);
    this.atualizarContadores();
  }

  removerProduto(produtoId: string): void {
    if (!this.produtos) {
      this.produtos = [];
    }

    const index = this.produtos.findIndex(p => p.id === produtoId);
    if (index === -1) {
      throw new CategoriaInvalidaError('Produto não está associado a esta categoria');
    }

    this.produtos.splice(index, 1);
    this.atualizarContadores();
  }

  atualizarContadores(): void {
    if (!this.produtos) {
      this.produtos = [];
    }

    this.totalProdutos = this.produtos.length;
    this.totalProdutosAtivos = this.produtos.filter(p => p.ativo && p.disponivel).length;
  }

  // Atualização de dados
  atualizarNome(novoNome: string): void {
    if (!novoNome?.trim()) {
      throw new CategoriaInvalidaError('Nome da categoria é obrigatório');
    }

    if (novoNome.length < 2) {
      throw new CategoriaInvalidaError('Nome da categoria deve ter pelo menos 2 caracteres');
    }

    this.nome = novoNome.trim();
  }
  atualizarDescricao(novaDescricao: string): void {
    this.descricao = novaDescricao?.trim() || null;
  }

  atualizarCor(novaCor: string): void {
    if (novaCor && !this.isValidHexColor(novaCor)) {
      throw new CategoriaInvalidaError('Cor deve estar no formato hexadecimal válido (#RRGGBB)');
    }
    this.corHex = novaCor;
  }

  atualizarOrdem(novaOrdem: number): void {
    if (novaOrdem < 0) {
      throw new CategoriaInvalidaError('Ordem não pode ser negativa');
    }
    this.ordem = novaOrdem;
  }

  definirImagem(imagemUrl: string): void {
    this.imagemUrl = imagemUrl;
  }

  // Consultas de negócio
  temProdutos(): boolean {
    return this.totalProdutos > 0;
  }

  temProdutosAtivos(): boolean {
    return this.totalProdutosAtivos > 0;
  }

  ehPopular(): boolean {
    return this.totalProdutosAtivos >= 10;
  }

  getProdutosAtivos(): Produto[] {
    if (!this.produtos) return [];
    return this.produtos.filter(p => p.ativo && p.disponivel);
  }

  getProdutosDisponiveis(): Produto[] {
    if (!this.produtos) return [];
    return this.produtos.filter(p => p.ehDisponivel());
  }

  // Validações
  podeSerDesativada(): boolean {
    return this.totalProdutosAtivos === 0;
  }

  ehValida(): boolean {
    return this.nome?.trim().length >= 2;
  }

  // Factory Methods
  static criarCategoriaBasica(nome: string, estabelecimentoId?: string): Categoria {
    return this.criar({
      nome,
      estabelecimentoId
    });
  }

  static criarCategoriaCompleta(dados: {
    nome: string;
    descricao: string;
    corHex: string;
    estabelecimentoId?: string;
    ordem?: number;
  }): Categoria {
    return this.criar(dados);
  }

  // Métodos de resumo
  obterResumo(): any {
    return {
      id: this.id,
      nome: this.nome,
      descricao: this.descricao,
      ativo: this.ativo,
      imagemUrl: this.imagemUrl,
      corHex: this.corHex,
      ordem: this.ordem,
      estabelecimentoId: this.estabelecimentoId,
      totalProdutos: this.totalProdutos,
      totalProdutosAtivos: this.totalProdutosAtivos,
      temProdutos: this.temProdutos(),
      temProdutosAtivos: this.temProdutosAtivos(),
      ehPopular: this.ehPopular(),
      podeSerDesativada: this.podeSerDesativada(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
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
