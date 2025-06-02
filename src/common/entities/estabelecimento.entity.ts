import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'estabelecimento' })
export class Estabelecimento {
  @PrimaryGeneratedColumn({ name: 'estabelecimentoId' })
  estabelecimentoId!: number;

  @Column()
  nome!: string;

  @Column()
  endereco!: string;

  @Column()
  telefone!: string;

  @Column({ default: 'PENDENTE' })
  status!: string; // 'APROVADO', 'PENDENTE', 'REJEITADO'
}