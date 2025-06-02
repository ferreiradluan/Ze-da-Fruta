import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { PerfilUsuarioEntity } from '../../common/entities/perfil-usuario.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SELLER = 'seller',
  DELIVERY_PERSON = 'delivery'
}

export enum UserProfileType {
  CUSTOMER = 'customer',
  DELIVERY_PERSON = 'delivery_person',
  SELLER = 'seller',
}

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn({ name: 'userId' })
  userId!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ nullable: true })
  senha?: string;

  @Column({ nullable: true })
  picture?: string;

  @Column({ default: 'google' })
  provider!: string;

  @Column({
    type: 'varchar',
    default: UserRole.USER,
  })
  role!: UserRole;

  @Column({
    type: 'varchar',
    default: UserProfileType.CUSTOMER,
  })
  profileType!: UserProfileType;

  @Column({ default: false })
  isEmailVerified!: boolean;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @Column({ default: 0 })
  loginAttempts!: number;

  @Column({ nullable: true })
  lockedUntil?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => PerfilUsuarioEntity, (perfil: PerfilUsuarioEntity) => perfil.usuario)
  perfis!: PerfilUsuarioEntity[];

  @Column({ default: 'ATIVO' })
  status!: string;
}