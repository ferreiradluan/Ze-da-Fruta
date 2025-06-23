import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { STATUS_PEDIDO, StatusPedido } from '../types/status-pedido.types';
import { ItemPedido } from './item-pedido.entity';
import { Cupom } from './cupom.entity';
import { Produto } from './produto.entity';
import { Dinheiro } from '../value-objects/dinheiro.vo';
import { BadRequestException } from '@nestjs/common';
import { 
  PedidoCriadoEvent, 
  PedidoConfirmadoEvent, 
  PedidoCanceladoEvent,
  PedidoStatusAtualizadoEvent 
} from '../events/pedido.events';
import { DomainEvent } from '../../../common/domain/events/domain-event';

// DTOs para Factory Methods
export interface SacolaDto {
  itens: { produtoId: string; quantidade: number }[];
  enderecoEntrega?: string;
  observacoes?: string;
}

export interface EnderecoDto {
  logradouro: string;
  numero: string;
  cep: string;
  cidade: string;
  estado: string;
  complemento?: string;
}

@Entity('pedidos')
export class Pedido extends BaseEntity {
  @Column()
  clienteId!: string;
  @Column({
    type: 'varchar',
    enum: Object.values(STATUS_PEDIDO),
    default: STATUS_PEDIDO.PAGAMENTO_PENDENTE
  })
  status!: StatusPedido;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  valorTotal!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  valorDesconto!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  valorSubtotal!: number;

  @Column({ nullable: true })
  observacoes?: string;

  @Column({ nullable: true })
  enderecoEntrega?: string;

  @Column({ nullable: true })
  telefoneContato?: string;

  @Column({ nullable: true })
  dataEntregaPrevista?: Date;

  @Column({ nullable: true })
  estabelecimentoId?: string;

  // Relacionamentos
  @OneToMany(() => ItemPedido, item => item.pedido, { cascade: true, eager: true })
  itens!: ItemPedido[];

  @ManyToOne(() => Cupom, { nullable: true })
  @JoinColumn({ name: 'cupom_id' })
  cupom: Cupom | null = null;

  @Column({ type: 'varchar', nullable: true })
  cupomId: string | null = null;

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
  // ===== FACTORY METHODS (DDD Pattern) =====
    /**
   * Factory method para criar um novo pedido
   * Encapsula toda a lógica de criação e validação
   */
  static criarNovo(clienteId: string, dadosSacola: SacolaDto): Pedido {
    const pedido = new Pedido();
    pedido.clienteId = clienteId;
    pedido.status = STATUS_PEDIDO.PAGAMENTO_PENDENTE;
    pedido.itens = [];
    pedido.valorTotal = 0;
    pedido.valorSubtotal = 0;
    pedido.valorDesconto = 0;
    
    // Validar sacola antes de processar
    pedido.validarSacola(dadosSacola);
    
    // Definir dados adicionais
    if (dadosSacola.enderecoEntrega) {
      pedido.enderecoEntrega = dadosSacola.enderecoEntrega;
    }
    if (dadosSacola.observacoes) {
      pedido.observacoes = dadosSacola.observacoes;
    }
      // Disparar evento de criação
    pedido.addDomainEvent(new PedidoCriadoEvent(
      pedido.id!,
      clienteId,
      pedido.valorTotal,
      pedido.itens.length,
      pedido.estabelecimentoId
    ));
    
    return pedido;
  }

  static criarParaTeste(clienteId: string): Pedido {
    const pedido = new Pedido();
    pedido.clienteId = clienteId;
    pedido.status = STATUS_PEDIDO.PAGAMENTO_PENDENTE;
    pedido.itens = [];
    pedido.valorTotal = 0;
    pedido.valorSubtotal = 0;
    pedido.valorDesconto = 0;
    return pedido;
  }

  // ===== MÉTODOS DE NEGÓCIO PRINCIPAIS =====
  confirmar(endereco?: EnderecoDto): void {
    if (this.status !== STATUS_PEDIDO.PAGAMENTO_PENDENTE) {
      throw new Error('Apenas pedidos com pagamento pendente podem ser confirmados');
    }

    if (this.itens.length === 0) {
      throw new Error('Não é possível confirmar um pedido sem itens');
    }

    if (endereco) {
      this.enderecoEntrega = this.formatarEndereco(endereco);
    }

    this.status = STATUS_PEDIDO.PAGO;
    
    // Usar o cupom se houver
    if (this.cupom) {
      this.cupom.usar();
    }

    // Reservar estoque dos produtos
    this.reservarEstoqueProdutos();    // Disparar evento de confirmação
    this.addDomainEvent(new PedidoConfirmadoEvent(
      this.id!,
      this.clienteId,
      this.valorTotal,
      this.enderecoEntrega
    ));
  }
  cancelar(motivo?: string): void {
    if (this.status === STATUS_PEDIDO.ENTREGUE) {
      throw new Error('Pedidos entregues não podem ser cancelados');
    }

    if (this.status === STATUS_PEDIDO.CANCELADO) {
      throw new Error('Pedido já está cancelado');
    }

    this.status = STATUS_PEDIDO.CANCELADO;
      // Liberar cupom se houver
    if (this.cupom) {
      this.cupom.vezesUsado = Math.max(0, (this.cupom.vezesUsado || 0) - 1);
    }

    // Liberar estoque reservado
    this.liberarEstoqueProdutos();

    // Adicionar motivo às observações
    if (motivo) {
      this.observacoes = this.observacoes 
        ? `${this.observacoes}\n\nCancelamento: ${motivo}`
        : `Cancelamento: ${motivo}`;
    }    // Disparar evento de cancelamento
    this.addDomainEvent(new PedidoCanceladoEvent(
      this.id!,
      this.clienteId,
      motivo
    ));
  }

  // ===== VALIDAÇÕES DE NEGÓCIO =====

  private validarSacola(sacola: SacolaDto): void {
    if (!sacola.itens || sacola.itens.length === 0) {
      throw new BadRequestException('Sacola não pode estar vazia');
    }

    // Validar cada item da sacola
    for (const item of sacola.itens) {
      if (!item.produtoId) {
        throw new BadRequestException('Produto ID é obrigatório');
      }
      if (!item.quantidade || item.quantidade <= 0) {
        throw new BadRequestException('Quantidade deve ser maior que zero');
      }
      if (item.quantidade > 100) {
        throw new BadRequestException('Quantidade não pode ser maior que 100 por item');
      }
    }
  }

  private validarEstabelecimentoUnico(): void {
    if (this.itens.length === 0) return;

    const estabelecimentos = new Set(
      this.itens.map(item => item.produto?.estabelecimentoId).filter(Boolean)
    );

    if (estabelecimentos.size > 1) {
      throw new BadRequestException('Todos os produtos devem ser do mesmo estabelecimento');
    }

    // Definir estabelecimento do pedido
    const estabelecimentoId = Array.from(estabelecimentos)[0];
    if (estabelecimentoId) {
      this.estabelecimentoId = estabelecimentoId;
    }
  }

  private validarProdutosDisponiveis(): void {
    for (const item of this.itens) {
      if (!item.produto) continue;
      
      if (!item.produto.estaDisponivel()) {
        throw new BadRequestException(`Produto ${item.produto.nome} não está disponível`);
      }
      
      if (!item.produto.temEstoqueSuficiente(item.quantidade)) {
        throw new BadRequestException(
          `Estoque insuficiente para ${item.produto.nome}. Disponível: ${item.produto.estoque}`
        );
      }
    }
  }

  private calcularValores(): void {
    this.valorSubtotal = this.itens.reduce((total, item) => total + item.subtotal, 0);
    this.valorTotal = this.valorSubtotal - this.valorDesconto;
  }

  private reservarEstoqueProdutos(): void {
    for (const item of this.itens) {
      if (item.produto && item.produto.reservarEstoque) {
        item.produto.reservarEstoque(item.quantidade);
      }
    }
  }

  private liberarEstoqueProdutos(): void {
    for (const item of this.itens) {
      if (item.produto && item.produto.liberarEstoque) {
        item.produto.liberarEstoque(item.quantidade);
      }
    }
  }

  private formatarEndereco(endereco: EnderecoDto): string {
    return `${endereco.logradouro}, ${endereco.numero}${endereco.complemento ? `, ${endereco.complemento}` : ''}, ${endereco.cidade}/${endereco.estado}, CEP: ${endereco.cep}`;
  }

  // Métodos para trabalhar com Value Objects
  getValorTotal(): Dinheiro {
    return Dinheiro.criar(this.valorTotal);
  }

  getValorSubtotal(): Dinheiro {
    return Dinheiro.criar(this.valorSubtotal);
  }

  getValorDesconto(): Dinheiro {
    return Dinheiro.criar(this.valorDesconto);
  }

  // Métodos de Negócio (Rich Domain Model)
  adicionarItem(produto: Produto, quantidade: number): void {
    if (!produto.estaDisponivel()) {
      throw new Error(`Produto ${produto.nome} não está disponível`);
    }

    if (quantidade <= 0) {
      throw new Error('Quantidade deve ser maior que zero');
    }

    if (produto.estoque < quantidade) {
      throw new Error(`Estoque insuficiente. Disponível: ${produto.estoque}`);
    }

    // Inicializar array se necessário
    if (!this.itens) {
      this.itens = [];
    }    // Verificar se o item já existe no pedido
    const itemExistente = this.itens.find(item => item.produto?.id === produto.id);
    
    if (itemExistente) {
      itemExistente.atualizarQuantidade(itemExistente.quantidade + quantidade);
    } else {
      const novoItem = ItemPedido.criar(produto, quantidade);
      novoItem.pedido = this;
      this.itens.push(novoItem);
    }

    this.calcularTotal();
  }

  removerItem(itemId: string): void {
    const index = this.itens.findIndex(item => item.id === itemId);
    
    if (index === -1) {
      throw new Error('Item não encontrado no pedido');
    }

    this.itens.splice(index, 1);
    this.calcularTotal();
  }

  atualizarQuantidadeItem(itemId: string, novaQuantidade: number): void {
    const item = this.itens.find(item => item.id === itemId);
    
    if (!item) {
      throw new Error('Item não encontrado no pedido');
    }

    if (novaQuantidade <= 0) {
      this.removerItem(itemId);
    } else {
      item.atualizarQuantidade(novaQuantidade);
      this.calcularTotal();
    }
  }
  calcularTotal(): void {
    // Inicializar array se necessário
    if (!this.itens) {
      this.itens = [];
    }

    // Calcular subtotal
    this.valorSubtotal = this.itens.reduce((total, item) => {
      return total + item.subtotal;
    }, 0);

    // Aplicar desconto do cupom
    this.valorDesconto = 0;
    if (this.cupom) {
      this.valorDesconto = this.cupom.calcularDesconto(this.valorSubtotal);
    }

    // Calcular total final
    this.valorTotal = this.valorSubtotal - this.valorDesconto;
  }

  aplicarCupom(cupom: Cupom): void {
    if (!cupom.estaValido()) {
      throw new Error('Cupom inválido ou expirado');
    }

    if (!cupom.podeSerAplicado(this.valorSubtotal)) {
      throw new Error('Cupom não pode ser aplicado a este pedido');
    }

    this.cupom = cupom;
    this.cupomId = cupom.id || null;
    this.calcularTotal();
  }

  removerCupom(): void {    this.cupom = null;
    this.cupomId = null;
    this.calcularTotal();
  }
  atualizarStatus(novoStatus: StatusPedido): void {
    // Validar transições de status válidas
    const transicoesValidas = this.obterTransicoesValidas();
    
    if (!transicoesValidas.includes(novoStatus)) {
      throw new Error(`Transição de ${this.status} para ${novoStatus} não é permitida`);
    }

    const statusAnterior = this.status;
    this.status = novoStatus;    // Disparar evento de atualização de status
    this.addDomainEvent(new PedidoStatusAtualizadoEvent(
      this.id!,
      statusAnterior,
      novoStatus,
      this.clienteId
    ));
  }

  private obterTransicoesValidas(): StatusPedido[] {
    switch (this.status) {
      case STATUS_PEDIDO.PAGAMENTO_PENDENTE:
        return [STATUS_PEDIDO.PAGO, STATUS_PEDIDO.CANCELADO];
      case STATUS_PEDIDO.PAGO:
        return [STATUS_PEDIDO.EM_PREPARACAO, STATUS_PEDIDO.CANCELADO];
      case STATUS_PEDIDO.EM_PREPARACAO:
        return [STATUS_PEDIDO.AGUARDANDO_ENTREGADOR, STATUS_PEDIDO.CANCELADO];
      case STATUS_PEDIDO.AGUARDANDO_ENTREGADOR:
        return [STATUS_PEDIDO.ENTREGUE, STATUS_PEDIDO.CANCELADO];
      case STATUS_PEDIDO.ENTREGUE:
        return []; // Status final
      case STATUS_PEDIDO.CANCELADO:
        return []; // Status final
      default:
        return [];
    }
  }

  podeSerEditado(): boolean {
    return this.status === STATUS_PEDIDO.PAGAMENTO_PENDENTE || this.status === STATUS_PEDIDO.PAGO;
  }

  enviar(): void {
    if (this.status !== STATUS_PEDIDO.EM_PREPARACAO) {
      throw new Error('Apenas pedidos em preparação podem ser enviados');
    }
    this.status = STATUS_PEDIDO.AGUARDANDO_ENTREGADOR;
  }

  entregar(): void {
    if (this.status !== STATUS_PEDIDO.AGUARDANDO_ENTREGADOR) {
      throw new Error('Apenas pedidos aguardando entregador podem ser entregues');
    }
    this.status = STATUS_PEDIDO.ENTREGUE;
  }

  obterResumo(): any {
    return {
      id: this.id,
      status: this.status,
      valorTotal: this.valorTotal,
      valorSubtotal: this.valorSubtotal,
      valorDesconto: this.valorDesconto,
      quantidadeItens: this.itens.length,
      itens: this.itens.map(item => ({
        id: item.id,
        produto: item.nomeProduto,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        subtotal: item.subtotal
      })),
      cupom: this.cupom ? {
        codigo: this.cupom.codigo,
        desconto: this.valorDesconto
      } : null,
      createdAt: this.createdAt
    };
  }

  // Validações de Domínio Rico
  validar(): void {
    if (!this.clienteId) {
      throw new BadRequestException('Cliente não identificado');
    }

    if (!this.itens || this.itens.length === 0) {
      throw new BadRequestException('Pedido deve ter pelo menos um item');
    }

    this.itens.forEach(item => {
      item.validar();
    });
  }

  atualizarEnderecoEntrega(endereco: EnderecoDto): void {
    this.enderecoEntrega = `${endereco.logradouro}, ${endereco.numero} - ${endereco.cidade}/${endereco.estado}`;
  }
}
