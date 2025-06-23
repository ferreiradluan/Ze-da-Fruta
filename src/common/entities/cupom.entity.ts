import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'cupom' })
export class Cupom {
  @PrimaryGeneratedColumn({ name: 'cupomId' })
  cupomId!: number;

  @Column()
  codigo!: string;

  @Column()
  desconto!: number;

  @Column()
  validade!: Date;
}