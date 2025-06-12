import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { Produto } from './produto.entity';

@Entity()
export class Categoria extends BaseEntity {
  @Column()
  nome: string;

  @Column({ nullable: true })
  descricao: string;

  @Column({ default: true })
  ativo: boolean;
  @ManyToMany(() => Produto, produto => produto.categorias)
  produtos: Produto[];
}
