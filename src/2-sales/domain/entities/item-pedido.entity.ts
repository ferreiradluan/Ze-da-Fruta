import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { AggregateRoot } from '../../../common/domain/aggregate-root.base';
import { Pedido } from './pedido.entity';
import { Produto } from './produto.entity';
import { Dinheiro } from '../value-objects/dinheiro.vo';
import {
  ItemPedidoInvalidoError,
  QuantidadeInvalidaError,
  PrecoInvalidoError,
  ProdutoIndisponivelError
} from '../errors';
import {
  ItemPedidoCriadoEvent,
  ItemPedidoQuantidadeAlteradaEvent,
  ItemPedidoRemovidoEvent,
  ItemPedidoPrecoAtualizadoEvent
} from '../events';

export interface ObservacaoItem {
  tipo: 'REMOVER' | 'ADICIONAR' | 'SUBSTITUIR' | 'OBSERVACAO';
  descricao: string;
}

export interface PersonalizacaoItem {
  id: string;
  nome: string;
  preco: number;
  obrigatoria: boolean;
  selecionada: boolean;
}

@Entity('itens_pedido')
export class ItemPedido extends BaseEntity {
  private _aggregateRoot: AggregateRoot = new (class extends AggregateRoot {})(this.id || '');

  @Column('int')
  quantidade: number;

  @Column('decimal', { precision: 10, scale: 2 })
  precoUnitario: number; // Snapshot do preço no momento da compra

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  valorDesconto: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  valorAcrescimo: number;

  @Column('text', { nullable: true })
  observacoes: string | null;

  @Column('json', { nullable: true })
  personalizacoes: PersonalizacaoItem[] | null;

  @Column({ default: false })
  foiPersonalizado: boolean;

  @Column({ default: 1 })
  sequencia: number; // Ordem do item no pedido

  // Relacionamentos
  @ManyToOne(() => Pedido, pedido => pedido.itens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;

  @Column()
  pedidoId: string;

  @ManyToOne(() => Produto)
  @JoinColumn({ name: 'produto_id' })
  produto: Produto;

  @Column()
  produtoId: string;

  // Snapshot dos dados do produto no momento da compra
  @Column()
  nomeProduto: string;

  @Column({ nullable: true })
  imagemProduto: string | null;

  @Column({ nullable: true })
  descricaoProduto: string | null;

  @Column({ nullable: true })
  unidadeMedida: string | null;

  @Column({ nullable: true })
  categoriaProduto: string | null;

  // ===== MÉTODOS DE NEGÓCIO (RICH DOMAIN) =====

  static criar(produto: Produto, quantidade: number, observacoes?: string): ItemPedido {
    const item = new ItemPedido();
    item.validarDadosObrigatorios(produto, quantidade);

    // Dados do produto (snapshot)
    item.produtoId = produto.id || '';
    item.produto = produto;
    item.nomeProduto = produto.nome;
    item.imagemProduto = produto.imagemUrl || null;
    item.descricaoProduto = produto.descricao || null;
    item.unidadeMedida = produto.unidadeMedida;

    // Dados do item
    item.quantidade = quantidade;
    item.precoUnitario = produto.preco;
    item.observacoes = observacoes || null;
    item.valorDesconto = 0;
    item.valorAcrescimo = 0;
    item.foiPersonalizado = false;
    item.sequencia = 1;
    item.personalizacoes = [];

    item.calcularSubtotal();

    return item;
  }

  private validarDadosObrigatorios(produto: Produto, quantidade: number): void {
    if (!produto) {
      throw new ItemPedidoInvalidoError('Produto é obrigatório');
    }

    if (!produto.ehDisponivel()) {
      throw new ProdutoIndisponivelError(produto.nome);
    }

    if (quantidade <= 0) {
      throw new QuantidadeInvalidaError('Quantidade deve ser maior que zero');
    }

    if (!produto.temEstoqueSuficiente(quantidade)) {
      throw new ItemPedidoInvalidoError(
        `Estoque insuficiente para '${produto.nome}'. Disponível: ${produto.getEstoqueDisponivel()}`
      );
    }

    if (produto.preco <= 0) {
      throw new PrecoInvalidoError('Preço do produto deve ser maior que zero');
    }
  }

  // Gestão de Quantidade
  atualizarQuantidade(novaQuantidade: number): void {
    if (novaQuantidade <= 0) {
      throw new QuantidadeInvalidaError('Quantidade deve ser maior que zero');
    }

    const quantidadeAnterior = this.quantidade;
    this.quantidade = novaQuantidade;
    this.calcularSubtotal();

    // Disparar evento de alteração de quantidade
    this.addDomainEvent(new ItemPedidoQuantidadeAlteradaEvent(
      this.id || '',
      this.pedidoId,
      this.produtoId,
      quantidadeAnterior,
      novaQuantidade,
      this.subtotal
    ));
  }

  aumentarQuantidade(incremento: number = 1): void {
    if (incremento <= 0) {
      throw new QuantidadeInvalidaError('Incremento deve ser maior que zero');
    }
    this.atualizarQuantidade(this.quantidade + incremento);
  }

  diminuirQuantidade(decremento: number = 1): void {
    if (decremento <= 0) {
      throw new QuantidadeInvalidaError('Decremento deve ser maior que zero');
    }

    const novaQuantidade = this.quantidade - decremento;
    if (novaQuantidade <= 0) {
      throw new QuantidadeInvalidaError('Quantidade resultante deve ser maior que zero');
    }

    this.atualizarQuantidade(novaQuantidade);
  }

  // Gestão de Preços e Cálculos
  calcularSubtotal(): void {
    const precoBase = Dinheiro.criar(this.precoUnitario);
    const quantidade = this.quantidade;

    // Calcular subtotal base
    let subtotalBase = precoBase.multiplicar(quantidade);

    // Adicionar personalizações
    if (this.personalizacoes && this.personalizacoes.length > 0) {
      for (const personalizacao of this.personalizacoes) {
        if (personalizacao.selecionada) {
          const precoPersonalizacao = Dinheiro.criar(personalizacao.preco);
          subtotalBase = subtotalBase.somar(precoPersonalizacao.multiplicar(quantidade));
        }
      }
    }

    // Aplicar acréscimos
    if (this.valorAcrescimo > 0) {
      const acrescimo = Dinheiro.criar(this.valorAcrescimo);
      subtotalBase = subtotalBase.somar(acrescimo);
    }

    // Aplicar descontos
    if (this.valorDesconto > 0) {
      const desconto = Dinheiro.criar(this.valorDesconto);
      subtotalBase = subtotalBase.subtrair(desconto);
    }

    this.subtotal = subtotalBase.valor;
  }

  aplicarDesconto(valor: number, motivo?: string): void {
    if (valor < 0) {
      throw new ItemPedidoInvalidoError('Valor do desconto não pode ser negativo');
    }

    if (valor > this.getSubtotalSemDesconto()) {
      throw new ItemPedidoInvalidoError('Desconto não pode ser maior que o subtotal do item');
    }

    this.valorDesconto = valor;
    this.calcularSubtotal();
  }

  aplicarAcrescimo(valor: number, motivo?: string): void {
    if (valor < 0) {
      throw new ItemPedidoInvalidoError('Valor do acréscimo não pode ser negativo');
    }

    this.valorAcrescimo = valor;
    this.calcularSubtotal();
  }

  removerDesconto(): void {
    this.valorDesconto = 0;
    this.calcularSubtotal();
  }

  removerAcrescimo(): void {
    this.valorAcrescimo = 0;
    this.calcularSubtotal();
  }

  // Gestão de Personalizações
  adicionarPersonalizacao(personalizacao: PersonalizacaoItem): void {
    if (!this.personalizacoes) {
      this.personalizacoes = [];
    }

    // Verificar se já existe
    const jaExiste = this.personalizacoes.some(p => p.id === personalizacao.id);
    if (jaExiste) {
      throw new ItemPedidoInvalidoError('Personalização já foi adicionada');
    }

    this.personalizacoes.push(personalizacao);
    this.foiPersonalizado = true;
    this.calcularSubtotal();
  }

  removerPersonalizacao(personalizacaoId: string): void {
    if (!this.personalizacoes) return;

    const index = this.personalizacoes.findIndex(p => p.id === personalizacaoId);
    if (index === -1) {
      throw new ItemPedidoInvalidoError('Personalização não encontrada');
    }

    this.personalizacoes.splice(index, 1);
    this.foiPersonalizado = this.personalizacoes.length > 0;
    this.calcularSubtotal();
  }

  alternarPersonalizacao(personalizacaoId: string): void {
    if (!this.personalizacoes) return;

    const personalizacao = this.personalizacoes.find(p => p.id === personalizacaoId);
    if (!personalizacao) {
      throw new ItemPedidoInvalidoError('Personalização não encontrada');
    }

    personalizacao.selecionada = !personalizacao.selecionada;
    this.calcularSubtotal();
  }

  // Gestão de Observações
  adicionarObservacao(observacao: string): void {
    const observacaoLimpa = observacao?.trim();
    if (!observacaoLimpa) {
      throw new ItemPedidoInvalidoError('Observação não pode estar vazia');
    }

    if (observacaoLimpa.length > 500) {
      throw new ItemPedidoInvalidoError('Observação não pode ter mais de 500 caracteres');
    }

    this.observacoes = observacaoLimpa;
  }

  removerObservacao(): void {
    this.observacoes = null;
  }

  // Atualização de dados do produto
  atualizarPreco(novoPreco: number): void {
    if (novoPreco <= 0) {
      throw new PrecoInvalidoError('Preço deve ser maior que zero');
    }

    const precoAnterior = this.precoUnitario;
    this.precoUnitario = novoPreco;
    this.calcularSubtotal();

    // Disparar evento de alteração de preço
    this.addDomainEvent(new ItemPedidoPrecoAtualizadoEvent(
      this.id || '',
      this.pedidoId,
      this.produtoId,
      precoAnterior,
      novoPreco,
      this.subtotal
    ));
  }

  definirSequencia(sequencia: number): void {
    if (sequencia < 1) {
      throw new ItemPedidoInvalidoError('Sequência deve ser maior que zero');
    }
    this.sequencia = sequencia;
  }

  // Consultas de negócio
  getPrecoUnitario(): Dinheiro {
    return Dinheiro.criar(this.precoUnitario);
  }

  getSubtotal(): Dinheiro {
    return Dinheiro.criar(this.subtotal);
  }

  getSubtotalSemDesconto(): number {
    return this.subtotal + this.valorDesconto;
  }

  getValorTotal(): number {
    return this.subtotal;
  }

  temDesconto(): boolean {
    return this.valorDesconto > 0;
  }

  temAcrescimo(): boolean {
    return this.valorAcrescimo > 0;
  }

  temObservacoes(): boolean {
    return this.observacoes !== null && this.observacoes.trim().length > 0;
  }

  temPersonalizacoes(): boolean {
    return this.foiPersonalizado && (this.personalizacoes?.length || 0) > 0;
  }

  getPersonalizacoesSelecionadas(): PersonalizacaoItem[] {
    if (!this.personalizacoes) return [];
    return this.personalizacoes.filter(p => p.selecionada);
  }

  getValorPersonalizacoes(): number {
    const selecionadas = this.getPersonalizacoesSelecionadas();
    return selecionadas.reduce((total, p) => total + (p.preco * this.quantidade), 0);
  }

  // Validações
  ehValido(): boolean {
    return this.quantidade > 0 && this.precoUnitario > 0 && this.subtotal >= 0;
  }

  podeSerEditado(): boolean {
    // Lógica para verificar se o item pode ser editado
    // Por exemplo, se o pedido ainda está em status editável
    return true; // Implementar lógica específica conforme necessário
  }

  // Factory Methods
  static criarItemSimples(produto: Produto, quantidade: number): ItemPedido {
    return this.criar(produto, quantidade);
  }

  static criarItemComObservacao(produto: Produto, quantidade: number, observacao: string): ItemPedido {
    return this.criar(produto, quantidade, observacao);
  }

  // Clonagem para modificações
  clonar(): ItemPedido {
    const clone = new ItemPedido();
    clone.quantidade = this.quantidade;
    clone.precoUnitario = this.precoUnitario;
    clone.subtotal = this.subtotal;
    clone.valorDesconto = this.valorDesconto;
    clone.valorAcrescimo = this.valorAcrescimo;
    clone.observacoes = this.observacoes;
    clone.personalizacoes = this.personalizacoes ? [...this.personalizacoes] : null;
    clone.foiPersonalizado = this.foiPersonalizado;
    clone.sequencia = this.sequencia;
    clone.produtoId = this.produtoId;
    clone.nomeProduto = this.nomeProduto;
    clone.imagemProduto = this.imagemProduto;
    clone.descricaoProduto = this.descricaoProduto;
    clone.unidadeMedida = this.unidadeMedida;
    clone.categoriaProduto = this.categoriaProduto;

    return clone;
  }

  // Método de resumo
  obterResumo(): any {
    return {
      id: this.id,
      pedidoId: this.pedidoId,
      produto: {
        id: this.produtoId,
        nome: this.nomeProduto,
        imagem: this.imagemProduto,
        descricao: this.descricaoProduto,
        unidadeMedida: this.unidadeMedida,
        categoria: this.categoriaProduto
      },
      quantidade: this.quantidade,
      precoUnitario: this.precoUnitario,
      subtotal: this.subtotal,
      valorDesconto: this.valorDesconto,
      valorAcrescimo: this.valorAcrescimo,
      observacoes: this.observacoes,
      personalizacoes: this.getPersonalizacoesSelecionadas(),
      valorPersonalizacoes: this.getValorPersonalizacoes(),
      foiPersonalizado: this.foiPersonalizado,
      sequencia: this.sequencia,
      // Flags de negócio
      temDesconto: this.temDesconto(),
      temAcrescimo: this.temAcrescimo(),
      temObservacoes: this.temObservacoes(),
      temPersonalizacoes: this.temPersonalizacoes(),
      ehValido: this.ehValido(),
      podeSerEditado: this.podeSerEditado(),
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
