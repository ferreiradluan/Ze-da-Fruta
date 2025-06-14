import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  adminId!: string;

  @Column()
  acao!: string;

  @Column('json')
  detalhes: any;

  @CreateDateColumn()
  timestamp!: Date;
}
