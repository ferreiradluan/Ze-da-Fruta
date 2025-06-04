import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'endereco' })
export class Endereco {
  @PrimaryGeneratedColumn({ name: 'enderecoId' })
  enderecoId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId', referencedColumnName: 'userId' })
  user!: User;

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