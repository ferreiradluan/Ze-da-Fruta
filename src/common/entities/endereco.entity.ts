import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'endereco' })
export class Endereco {
  @PrimaryGeneratedColumn({ name: 'enderecoId' })
  enderecoId!: number;

  @Column()
  rua!: string;

  @Column()
  numero!: string;

  @Column()
  cidade!: string;

  @Column()
  estado!: string;

  @Column()
  cep!: string;
}