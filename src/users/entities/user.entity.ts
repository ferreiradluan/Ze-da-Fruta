import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { Endereco } from '../../common/entities/endereco.entity';
import { PerfilUsuarioEntity } from '../../common/entities/perfil-usuario.entity';

// String constants ao invés de enums
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  PARTNER: 'PARTNER',
  DELIVERY: 'DELIVERY'
} as const;

export const STATUS_USUARIO = {
  ATIVO: 'ATIVO',
  INATIVO: 'INATIVO',
  PENDENTE: 'PENDENTE',
  BLOQUEADO: 'BLOQUEADO'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type StatusUsuario = typeof STATUS_USUARIO[keyof typeof STATUS_USUARIO];

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nome!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  telefone!: string;

  @Column({ nullable: true })
  senha?: string;

  @Column({ type: 'varchar', default: USER_ROLES.USER })
  role!: string;

  @Column({ type: 'varchar', default: STATUS_USUARIO.ATIVO })
  status!: string;

  @Column({ nullable: true })
  googleId?: string;

  @Column({ nullable: true })
  facebookId?: string;
  @Column({ nullable: true })
  photoUrl?: string;
  @OneToMany(() => Endereco, endereco => endereco.user)
  enderecos!: Endereco[];
  @OneToOne(() => PerfilUsuarioEntity, perfil => perfil.usuario)
  perfil?: PerfilUsuarioEntity;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
