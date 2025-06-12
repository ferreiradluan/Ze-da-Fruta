import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinColumn, JoinTable } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { Categoria } from './categoria.entity';
import { Estabelecimento } from './estabelecimento.entity';
import { Dinheiro } from '../value-objects/dinheiro.vo';

@Entity()
export class Produto extends BaseEntity {
  @Column()
  nome: string;

  @Column('decimal', { precision: 10, scale: 2 })
  preco: number; // Mantendo como number por simplicidade com TypeORM

  @Column({ nullable: true })
  descricao: string;

  @Column({ nullable: true })
  imagemUrl: string;

  @Column({ default: true })
  ativo: boolean;

  @Column({ default: true })
  disponivel: boolean;

  @Column({ default: 0 })
  estoque: number;

  @Column({ nullable: true })
  unidadeMedida: string; // kg, unidade, litro, etc.

  @Column({ nullable: true })
  partnerId: string;

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
}
