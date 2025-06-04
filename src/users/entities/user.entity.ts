import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Endereco } from '../../common/entities/endereco.entity';

// Certifique-se de exportar a entidade User
@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number = 0;

  // ...outras propriedades...

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