import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { Pedido } from './pedido.entity';
import { Produto } from './produto.entity';

@Entity('itens_pedido')
export class ItemPedido extends BaseEntity {
  @Column('int')
  quantidade: number;

  @Column('decimal', { precision: 10, scale: 2 })
  precoUnitario: number; // Snapshot do preço no momento da compra

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

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
  imagemProduto: string;

  // Métodos de Negócio
  calcularSubtotal(): void {
    this.subtotal = this.quantidade * this.precoUnitario;
  }

  static criar(produto: Produto, quantidade: number): ItemPedido {
    const item = new ItemPedido();
    item.produtoId = produto.id;
    item.produto = produto;
    item.quantidade = quantidade;
    item.precoUnitario = produto.preco;
    item.nomeProduto = produto.nome;
    item.imagemProduto = produto.imagemUrl;
    item.calcularSubtotal();
    return item;
  }

  atualizarQuantidade(novaQuantidade: number): void {
    if (novaQuantidade <= 0) {
      throw new Error('Quantidade deve ser maior que zero');
    }
    this.quantidade = novaQuantidade;
    this.calcularSubtotal();
  }
}
