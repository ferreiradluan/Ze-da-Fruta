import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SolicitacaoParceiro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column({ type: 'json' })
  dados: any; // JSON conforme diagrama

  @Column()
  tipo: string;

  @Column()
  status: string;
}