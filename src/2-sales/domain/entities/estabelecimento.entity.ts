import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { Produto } from './produto.entity';

@Entity()
export class Estabelecimento extends BaseEntity {
  @Column()
  nome: string;

  @Column()
  cnpj: string;

  @Column()
  endereco: string;

  @Column({ nullable: true })
  telefone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  usuarioId: string; // ID do usuário proprietário

  @Column({ default: true })
  ativo: boolean;

  @Column({ default: true })
  estaAberto: boolean;
  @Column({ nullable: true })
  descricao: string;

  @Column({ nullable: true })
  imagemUrl: string; // URL/caminho da imagem do estabelecimento

  @Column('decimal', { precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 11, scale: 8, nullable: true })
  longitude: number;

  @OneToMany(() => Produto, produto => produto.estabelecimento)
  produtos: Produto[];

  // Métodos de Negócio (Rich Domain Model)
  abrir(): void {
    if (!this.ativo) {
      throw new Error('Estabelecimento inativo não pode ser aberto');
    }
    this.estaAberto = true;
  }

  fechar(): void {
    this.estaAberto = false;
  }

  podeVender(): boolean {
    return this.ativo && this.estaAberto;
  }
}
