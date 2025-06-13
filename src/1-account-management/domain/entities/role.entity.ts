import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number; // Integer conforme diagrama

  @Column({ unique: true })
  nome: string;
}
