import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { Produto } from './produto.entity';
import { Estabelecimento } from './estabelecimento.entity';

@Entity()
export class Categoria extends BaseEntity {
  @Column()
  nome: string;

  @Column({ nullable: true })
  descricao: string;

  @Column({ default: true })
  ativo: boolean;

  @Column({ nullable: true })
  estabelecimentoId: string;

  @ManyToOne(() => Estabelecimento)
  @JoinColumn({ name: 'estabelecimentoId' })
  estabelecimento: Estabelecimento;

  @ManyToMany(() => Produto, produto => produto.categorias)
  produtos: Produto[];
}
