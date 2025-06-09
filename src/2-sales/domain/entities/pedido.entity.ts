import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { AggregateRoot } from '../../../common/domain/aggregate-root.base';
import { StatusPedido } from '../enums/status-pedido.enum';
import { ItemPedido } from './item-pedido.entity';
import { Cupom } from './cupom.entity';
import { Produto } from './produto.entity';
import { Dinheiro } from '../value-objects/dinheiro.vo';
import { 
  PedidoInvalidoError, 
  PedidoNaoPodeSerEditadoError,
  ItemPedidoNaoEncontradoError,
  CupomInvalidoError,
  StatusPedidoInvalidoError
} from '../errors/pedido.errors';
import { 
  PedidoCriadoEvent,
  PedidoConfirmadoEvent,
  PedidoCanceladoEvent,
  PedidoEntregueEvent,
  ItemAdicionadoEvent,
  ItemRemovidoEvent,
  CupomAplicadoEvent
} from '../events/pedido.events';
import { DomainEventDispatcher } from '../../../common/domain/events/domain-event.base';

export enum TipoPedido {
  BALCAO = 'BALCAO',
  DELIVERY = 'DELIVERY',
  RETIRADA = 'RETIRADA'
}

export enum FormaPagamento {
  DINHEIRO = 'DINHEIRO',
  CARTAO_CREDITO = 'CARTAO_CREDITO',
  CARTAO_DEBITO = 'CARTAO_DEBITO',
  PIX = 'PIX',
  VALE_ALIMENTACAO = 'VALE_ALIMENTACAO'
}

export interface EnderecoEntrega {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  cep: string;
  referencia?: string;
}

@Entity('pedidos')
export class Pedido extends BaseEntity {
  private _aggregateRoot: AggregateRoot = new (class extends AggregateRoot {})();
  @Column()
  clienteId: string;

  @Column({
    type: 'varchar',
    enum: StatusPedido,
    default: StatusPedido.PENDENTE
  })
  status: StatusPedido;

  @Column({
    type: 'varchar',
    enum: TipoPedido,
    default: TipoPedido.BALCAO
  })
  tipo: TipoPedido;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  valorTotal: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  valorDesconto: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  valorSubtotal: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  valorTaxaEntrega: number;
  @Column({ nullable: true })
  observacoes?: string;

  @Column('json', { nullable: true })
  enderecoEntrega: EnderecoEntrega | null;

  @Column({ nullable: true })
  telefoneContato?: string;

  @Column({ nullable: true })
  dataEntregaPrevista: Date;

  @Column({ nullable: true })
  dataConfirmacao: Date;

  @Column({ nullable: true })
  dataCancelamento: Date;

  @Column({ nullable: true })
  dataEntrega: Date;
  @Column({
    type: 'varchar',
    enum: FormaPagamento,
    nullable: true
  })
  formaPagamento?: FormaPagamento;

  @Column({ default: false })
  pagamentoConfirmado: boolean;

  @Column({ nullable: true })
  motivoCancelamento: string;

  @Column({ nullable: true })
  tempoEstimadoPreparo: number; // em minutos

  @Column({ nullable: true })
  estabelecimentoId: string;// Relacionamentos
  @OneToMany(() => ItemPedido, item => item.pedido, { cascade: true, eager: true })
  itens: ItemPedido[];

  @ManyToOne(() => Cupom, { nullable: true })
  @JoinColumn({ name: 'cupom_id' })
  cupom: Cupom | null = null;

  @Column({ type: 'varchar', nullable: true })
  cupomId: string | null = null;

  // Métodos de Negócio (Rich Domain Model)
  
  static criar(dados: {
    clienteId: string;
    tipo: TipoPedido;
    estabelecimentoId: string;
    enderecoEntrega?: EnderecoEntrega;
    telefoneContato?: string;
    observacoes?: string;
  }): Pedido {
    const pedido = new Pedido();
    pedido.validarDadosObrigatorios(dados);
    
    pedido.clienteId = dados.clienteId;
    pedido.tipo = dados.tipo;
    pedido.estabelecimentoId = dados.estabelecimentoId;    pedido.enderecoEntrega = dados.enderecoEntrega || null;
    pedido.telefoneContato = dados.telefoneContato;
    pedido.observacoes = dados.observacoes;// Inicializar valores
    pedido.status = StatusPedido.PENDENTE;
    pedido.valorTotal = 0;
    pedido.valorSubtotal = 0;
    pedido.valorDesconto = 0;
    pedido.valorTaxaEntrega = 0;
    pedido.pagamentoConfirmado = false;
    pedido.itens = [];

    return pedido;
  }

  private validarDadosObrigatorios(dados: any): void {
    if (!dados.clienteId) {
      throw new PedidoInvalidoError('Cliente é obrigatório');
    }
    if (!dados.estabelecimentoId) {
      throw new PedidoInvalidoError('Estabelecimento é obrigatório');
    }
    if (dados.tipo === TipoPedido.DELIVERY && !dados.enderecoEntrega) {
      throw new PedidoInvalidoError('Endereço de entrega é obrigatório para pedidos de delivery');
    }
  }    adicionarItem(produto: Produto, quantidade: number): void {
    if (!this.podeSerEditado()) {
      throw new PedidoNaoPodeSerEditadoError(this.status);
    }

    if (!produto.ehDisponivel()) {
      throw new PedidoInvalidoError(`Produto '${produto.nome}' não está disponível`);
    }

    if (quantidade <= 0) {
      throw new PedidoInvalidoError('Quantidade deve ser maior que zero');
    }

    if (!produto.temEstoqueSuficiente(quantidade)) {
      throw new PedidoInvalidoError(`Estoque insuficiente para '${produto.nome}'. Disponível: ${produto.getEstoqueDisponivel()}`);
    }

    // Inicializar array se necessário
    if (!this.itens) {
      this.itens = [];
    }

    // Verificar se o item já existe no pedido
    const itemExistente = this.itens.find(item => item.produtoId === produto.id);
    
    if (itemExistente) {
      const novaQuantidade = itemExistente.quantidade + quantidade;
      if (!produto.temEstoqueSuficiente(novaQuantidade)) {
        throw new PedidoInvalidoError(`Estoque insuficiente para quantidade total (${novaQuantidade}) do produto '${produto.nome}'`);
      }
      itemExistente.atualizarQuantidade(novaQuantidade);
    } else {
      const novoItem = ItemPedido.criar(produto, quantidade);
      novoItem.pedido = this;
      novoItem.pedidoId = this.id || '';
      this.itens.push(novoItem);

      // Disparar evento de item adicionado
      const dispatcher = new DomainEventDispatcher();
      dispatcher.dispatch(new ItemAdicionadoEvent(
        this.id || '',
        produto.id || '',
        produto.nome,
        quantidade,
        produto.preco
      ));
    }

    this.calcularTotal();
  }
  removerItem(itemId: string): void {
    if (!this.podeSerEditado()) {
      throw new PedidoNaoPodeSerEditadoError(this.status);
    }

    const index = this.itens.findIndex(item => item.id === itemId);
    
    if (index === -1) {
      throw new ItemPedidoNaoEncontradoError(itemId);
    }

    const itemRemovido = this.itens[index];
    this.itens.splice(index, 1);
    
    // Disparar evento de item removido
    const dispatcher = new DomainEventDispatcher();
    dispatcher.dispatch(new ItemRemovidoEvent(
      this.id || '',
      itemRemovido.produtoId || '',
      itemRemovido.nomeProduto,
      itemRemovido.quantidade
    ));

    this.calcularTotal();
  }
  atualizarQuantidadeItem(itemId: string, novaQuantidade: number): void {
    if (!this.podeSerEditado()) {
      throw new PedidoNaoPodeSerEditadoError(this.status);
    }

    const item = this.itens.find(item => item.id === itemId);
    
    if (!item) {
      throw new ItemPedidoNaoEncontradoError(itemId);
    }

    if (novaQuantidade <= 0) {
      this.removerItem(itemId);
    } else {
      item.atualizarQuantidade(novaQuantidade);
      this.calcularTotal();
    }
  }  calcularTotal(): void {
    // Inicializar array se necessário
    if (!this.itens) {
      this.itens = [];
    }

    // Calcular subtotal usando Dinheiro value object
    let subtotal = Dinheiro.criar(0);
    for (const item of this.itens) {
      subtotal = subtotal.somar(Dinheiro.criar(item.subtotal));
    }
    this.valorSubtotal = subtotal.valor;

    // Aplicar desconto do cupom
    let valorDesconto = Dinheiro.criar(0);
    if (this.cupom) {
      const descontoCalculado = this.cupom.calcularDesconto(this.valorSubtotal);
      valorDesconto = Dinheiro.criar(descontoCalculado);
    }
    this.valorDesconto = valorDesconto.valor;

    // Calcular taxa de entrega se aplicável
    this.calcularTaxaEntrega();

    // Calcular total final
    const taxaEntrega = Dinheiro.criar(this.valorTaxaEntrega);
    const total = subtotal.subtrair(valorDesconto).somar(taxaEntrega);
    this.valorTotal = total.valor;
  }

  private calcularTaxaEntrega(): void {
    if (this.tipo === TipoPedido.DELIVERY) {
      // Lógica de cálculo de taxa de entrega pode ser implementada aqui
      // Por exemplo: taxa fixa, baseada na distância, valor mínimo, etc.
      const subtotal = Dinheiro.criar(this.valorSubtotal);
      const valorMinimoFrete = Dinheiro.criar(50.00); // R$ 50,00
      
      if (subtotal.menorQue(valorMinimoFrete)) {
        this.valorTaxaEntrega = 8.00; // Taxa fixa de R$ 8,00
      } else {
        this.valorTaxaEntrega = 0; // Frete grátis
      }
    } else {
      this.valorTaxaEntrega = 0;
    }
  }
  aplicarCupom(cupom: Cupom): void {
    if (!this.podeSerEditado()) {
      throw new PedidoNaoPodeSerEditadoError(this.status);
    }

    if (!cupom.estaValido()) {
      throw new CupomInvalidoError('Cupom inválido ou expirado');
    }

    if (!cupom.podeSerAplicado(this.valorSubtotal)) {
      throw new CupomInvalidoError('Cupom não pode ser aplicado a este pedido');
    }

    this.cupom = cupom;
    this.cupomId = cupom.id;
    this.calcularTotal();    // Disparar evento de cupom aplicado
    const dispatcher = new DomainEventDispatcher();
    dispatcher.dispatch(new CupomAplicadoEvent(
      this.id || '',
      cupom.codigo,
      this.valorDesconto,
      this.valorSubtotal,
      this.valorTotal
    ));
  }

  removerCupom(): void {
    if (!this.podeSerEditado()) {
      throw new PedidoNaoPodeSerEditadoError(this.status);
    }

    this.cupom = null;
    this.cupomId = null;
    this.calcularTotal();
  }
  confirmar(): void {
    if (this.status !== StatusPedido.PENDENTE) {
      throw new StatusPedidoInvalidoError(this.status, StatusPedido.EM_PREPARO);
    }

    if (this.itens.length === 0) {
      throw new PedidoInvalidoError('Não é possível confirmar um pedido sem itens');
    }

    if (this.valorTotal <= 0) {
      throw new PedidoInvalidoError('Valor total deve ser maior que zero');
    }

    this.status = StatusPedido.EM_PREPARO;
    this.dataConfirmacao = new Date();
    this.calcularTempoEstimadoPreparo();
    
    // Usar o cupom se houver
    if (this.cupom) {
      this.cupom.usar();
    }    // Disparar evento de confirmação
    const dispatcher = new DomainEventDispatcher();
    dispatcher.dispatch(new PedidoConfirmadoEvent(
      this.id || '',
      this.clienteId,
      this.valorTotal,
      this.cupom?.codigo
    ));
  }

  private calcularTempoEstimadoPreparo(): void {
    // Calcular tempo baseado na quantidade e complexidade dos itens
    let tempoBase = 15; // 15 minutos base
    const tempoAdicionalPorItem = 5; // 5 minutos por item adicional
    
    if (this.itens.length > 1) {
      tempoBase += (this.itens.length - 1) * tempoAdicionalPorItem;
    }

    // Adicionar tempo extra para delivery
    if (this.tipo === TipoPedido.DELIVERY) {
      tempoBase += 20; // 20 minutos para entrega
    }

    this.tempoEstimadoPreparo = tempoBase;
    this.dataEntregaPrevista = new Date(Date.now() + tempoBase * 60 * 1000);
  }
  cancelar(motivo?: string): void {
    if (this.status === StatusPedido.ENTREGUE) {
      throw new StatusPedidoInvalidoError(this.status, StatusPedido.CANCELADO);
    }

    if (this.status === StatusPedido.CANCELADO) {
      throw new PedidoInvalidoError('Pedido já está cancelado');
    }

    this.status = StatusPedido.CANCELADO;
    this.dataCancelamento = new Date();
    this.motivoCancelamento = motivo || 'Não informado';

    // Disparar evento de cancelamento
    const dispatcher = new DomainEventDispatcher();
    dispatcher.dispatch(new PedidoCanceladoEvent(
      this.id || '',
      this.clienteId,
      this.motivoCancelamento,
      this.valorTotal,
      this.itens.map(item => ({
        produtoId: item.produtoId || '',
        quantidade: item.quantidade
      }))
    ));
  }

  enviar(): void {
    if (this.status !== StatusPedido.EM_PREPARO) {
      throw new StatusPedidoInvalidoError(this.status, StatusPedido.ENVIADO);
    }

    this.status = StatusPedido.ENVIADO;
  }

  entregar(): void {
    if (this.status !== StatusPedido.ENVIADO) {
      throw new StatusPedidoInvalidoError(this.status, StatusPedido.ENTREGUE);
    }

    this.status = StatusPedido.ENTREGUE;
    this.dataEntrega = new Date();

    // Disparar evento de entrega
    const dispatcher = new DomainEventDispatcher();
    dispatcher.dispatch(new PedidoEntregueEvent(
      this.id || '',
      this.clienteId,
      'entregador-id', // TODO: implementar sistema de entregadores
      this.enderecoEntrega ? JSON.stringify(this.enderecoEntrega) : '',
      this.calcularTempoEntrega()
    ));
  }

  private calcularTempoEntrega(): number {
    if (!this.dataConfirmacao || !this.dataEntrega) {
      return 0;
    }
    return Math.floor((this.dataEntrega.getTime() - this.dataConfirmacao.getTime()) / (1000 * 60));
  }
  podeSerEditado(): boolean {
    return this.status === StatusPedido.PENDENTE;
  }

  podeSerCancelado(): boolean {
    return this.status !== StatusPedido.ENTREGUE && this.status !== StatusPedido.CANCELADO;
  }

  // Métodos de consulta de negócio
  getValorTotal(): Dinheiro {
    return Dinheiro.criar(this.valorTotal);
  }

  getValorSubtotal(): Dinheiro {
    return Dinheiro.criar(this.valorSubtotal);
  }

  getValorDesconto(): Dinheiro {
    return Dinheiro.criar(this.valorDesconto);
  }

  getTaxaEntrega(): Dinheiro {
    return Dinheiro.criar(this.valorTaxaEntrega);
  }

  ehPedidoGrande(): boolean {
    return this.itens.length > 10 || this.valorSubtotal > 200;
  }

  temFreteGratis(): boolean {
    return this.valorTaxaEntrega === 0 && this.tipo === TipoPedido.DELIVERY;
  }

  ehElegibilidadeParaDesconto(): boolean {
    return this.valorSubtotal >= 100; // Acima de R$ 100,00
  }

  getQuantidadeTotalItens(): number {
    return this.itens.reduce((total, item) => total + item.quantidade, 0);
  }

  temProduto(produtoId: string): boolean {
    return this.itens.some(item => item.produtoId === produtoId);
  }

  getItem(produtoId: string): ItemPedido | undefined {
    return this.itens.find(item => item.produtoId === produtoId);
  }

  // Métodos de validação de negócio
  validarParaConfirmacao(): string[] {
    const erros: string[] = [];

    if (this.itens.length === 0) {
      erros.push('Pedido deve ter pelo menos um item');
    }

    if (this.valorTotal <= 0) {
      erros.push('Valor total deve ser maior que zero');
    }

    if (this.tipo === TipoPedido.DELIVERY && !this.enderecoEntrega) {
      erros.push('Endereço de entrega é obrigatório para delivery');
    }

    if (this.tipo === TipoPedido.DELIVERY && !this.telefoneContato) {
      erros.push('Telefone de contato é obrigatório para delivery');
    }

    return erros;
  }

  // Métodos de pagamento
  confirmarPagamento(formaPagamento: FormaPagamento): void {
    if (this.status !== StatusPedido.EM_PREPARO) {
      throw new StatusPedidoInvalidoError(this.status, StatusPedido.EM_PREPARO);
    }

    this.formaPagamento = formaPagamento;
    this.pagamentoConfirmado = true;
  }

  estornoPagamento(): void {
    if (!this.pagamentoConfirmado) {
      throw new PedidoInvalidoError('Não há pagamento para estornar');
    }

    this.pagamentoConfirmado = false;
    this.formaPagamento = undefined;
  }
  obterResumo(): any {
    return {
      id: this.id,
      clienteId: this.clienteId,
      estabelecimentoId: this.estabelecimentoId,
      status: this.status,
      tipo: this.tipo,
      valorTotal: this.valorTotal,
      valorSubtotal: this.valorSubtotal,
      valorDesconto: this.valorDesconto,
      valorTaxaEntrega: this.valorTaxaEntrega,
      quantidadeItens: this.itens.length,
      quantidadeTotalItens: this.getQuantidadeTotalItens(),
      itens: this.itens.map(item => ({
        id: item.id,
        produtoId: item.produtoId,
        produto: item.nomeProduto,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        subtotal: item.subtotal
      })),
      cupom: this.cupom ? {
        id: this.cupom.id,
        codigo: this.cupom.codigo,
        desconto: this.valorDesconto
      } : null,
      enderecoEntrega: this.enderecoEntrega,
      telefoneContato: this.telefoneContato,
      observacoes: this.observacoes,
      formaPagamento: this.formaPagamento,
      pagamentoConfirmado: this.pagamentoConfirmado,
      tempoEstimadoPreparo: this.tempoEstimadoPreparo,
      dataEntregaPrevista: this.dataEntregaPrevista,
      dataConfirmacao: this.dataConfirmacao,
      dataCancelamento: this.dataCancelamento,
      dataEntrega: this.dataEntrega,
      motivoCancelamento: this.motivoCancelamento,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // Flags de negócio
      podeSerEditado: this.podeSerEditado(),
      podeSerCancelado: this.podeSerCancelado(),
      ehPedidoGrande: this.ehPedidoGrande(),
      temFreteGratis: this.temFreteGratis(),
      ehElegibilidadeParaDesconto: this.ehElegibilidadeParaDesconto()
    };
  }

  // Método para criação rápida de pedidos básicos
  static criarPedidoBalcao(clienteId: string, estabelecimentoId: string): Pedido {
    return this.criar({
      clienteId,
      tipo: TipoPedido.BALCAO,
      estabelecimentoId
    });
  }
  static criarPedidoDelivery(
    clienteId: string, 
    estabelecimentoId: string, 
    enderecoEntrega: EnderecoEntrega,
    telefoneContato: string
  ): Pedido {
    return this.criar({
      clienteId,
      tipo: TipoPedido.DELIVERY,
      estabelecimentoId,
      enderecoEntrega,
      telefoneContato
    });
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
