import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { StatusPedido } from '../enums/status-pedido.enum';
import { ItemPedido } from './item-pedido.entity';
import { Cupom } from './cupom.entity';
import { Produto } from './produto.entity';
import { Dinheiro } from '../value-objects/dinheiro.vo';

@Entity('pedidos')
export class Pedido extends BaseEntity {
  @Column()
  clienteId: string;

  @Column({
    type: 'varchar',
    enum: StatusPedido,
    default: StatusPedido.PAGAMENTO_PENDENTE
  })
  status: StatusPedido;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  valorTotal: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  valorDesconto: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  valorSubtotal: number;

  @Column({ nullable: true })
  observacoes: string;

  @Column({ nullable: true })
  enderecoEntrega: string;

  @Column({ nullable: true })
  telefoneContato: string;

  @Column({ nullable: true })
  dataEntregaPrevista: Date;  // Relacionamentos
  @OneToMany(() => ItemPedido, item => item.pedido, { cascade: true, eager: true })
  itens: ItemPedido[];

  @ManyToOne(() => Cupom, { nullable: true })
  @JoinColumn({ name: 'cupom_id' })
  cupom: Cupom | null = null;

  @Column({ type: 'varchar', nullable: true })
  cupomId: string | null = null;

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
    }

    // Verificar se o item já existe no pedido
    const itemExistente = this.itens.find(item => item.produtoId === produto.id);
    
    if (itemExistente) {
      itemExistente.atualizarQuantidade(itemExistente.quantidade + quantidade);
    } else {
      const novoItem = ItemPedido.criar(produto, quantidade);
      novoItem.pedido = this;
      novoItem.pedidoId = this.id;
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
    this.cupomId = cupom.id;
    this.calcularTotal();
  }

  removerCupom(): void {
    this.cupom = null;
    this.cupomId = null;
    this.calcularTotal();
  }

  confirmar(): void {
    if (this.status !== StatusPedido.PAGAMENTO_PENDENTE) {
      throw new Error('Apenas pedidos com pagamento pendente podem ser confirmados');
    }

    if (this.itens.length === 0) {
      throw new Error('Não é possível confirmar um pedido sem itens');
    }

    this.status = StatusPedido.PAGO;
    
    // Usar o cupom se houver
    if (this.cupom) {
      this.cupom.usar();
    }
  }

  cancelar(): void {
    if (this.status === StatusPedido.ENTREGUE) {
      throw new Error('Não é possível cancelar um pedido já entregue');
    }

    if (this.status === StatusPedido.CANCELADO) {
      throw new Error('Pedido já está cancelado');
    }

    this.status = StatusPedido.CANCELADO;
  }

  enviar(): void {
    if (this.status !== StatusPedido.EM_PREPARACAO) {
      throw new Error('Apenas pedidos em preparação podem ser enviados');
    }

    this.status = StatusPedido.AGUARDANDO_ENTREGADOR;
  }

  entregar(): void {
    if (this.status !== StatusPedido.AGUARDANDO_ENTREGADOR) {
      throw new Error('Apenas pedidos aguardando entregador podem ser entregues');
    }

    this.status = StatusPedido.ENTREGUE;
  }

  podeSerEditado(): boolean {
    return this.status === StatusPedido.PAGAMENTO_PENDENTE;
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
}
