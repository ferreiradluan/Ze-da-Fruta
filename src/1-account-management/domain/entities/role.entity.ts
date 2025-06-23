import { Entity, Column, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { Usuario } from './usuario.entity';
import { ROLE_NAMES } from '../types/role.types';

@Entity('roles')
export class Role extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  nome?: string; // 'CLIENTE' | 'LOJISTA' | 'ENTREGADOR' | 'MODERADOR' | 'ADMIN'

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ type: 'boolean', default: true })
  ativa?: boolean;

  @ManyToMany(() => Usuario, (usuario) => usuario.roles)
  usuarios?: Usuario[];

  // === MÉTODOS DE DOMÍNIO RICO ===
  isCliente(): boolean {
    return this.nome === ROLE_NAMES.CLIENTE;
  }

  isLojista(): boolean {
    return this.nome === ROLE_NAMES.LOJISTA;
  }

  isEntregador(): boolean {
    return this.nome === ROLE_NAMES.ENTREGADOR;
  }

  isModerador(): boolean {
    return this.nome === ROLE_NAMES.MODERADOR;
  }
  isAdmin(): boolean {
    return this.nome === ROLE_NAMES.ADMIN;
  }

  desativar(): void {
    this.ativa = false;
  }

  ativar(): void {
    this.ativa = true;
  }
}
