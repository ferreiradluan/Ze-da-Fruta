import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Endereco } from '../../common/entities/endereco.entity';

// Certifique-se de exportar a entidade User
@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number = 0;

  @Column({ unique: true })
  email: string = '';

  @Column({ nullable: true })
  senha?: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  picture?: string;

  @Column({ default: 'user' })
  role: UserRole = UserRole.USER;

  @Column({ default: 'basic' })
  profileType: UserProfileType = UserProfileType.BASIC;

  @Column({ default: 'local' })
  provider: string = 'local';

  @Column({ default: false })
  isEmailVerified: boolean = false;

  @Column({ default: 0 })
  loginAttempts: number = 0;

  @Column({ type: 'datetime', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  lockedUntil?: Date;

  @OneToMany(() => Endereco, (endereco) => endereco.user)
  enderecos: Endereco[] = [];
}

// Add these exports if they do not exist
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SELLER = 'seller',
  DELIVERY_PERSON = 'delivery'
}

export enum UserProfileType {
  BASIC = 'basic',
  PREMIUM = 'premium',
}