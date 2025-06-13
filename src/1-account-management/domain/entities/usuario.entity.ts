import { Entity, Column, ManyToMany, OneToMany, OneToOne, JoinTable, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { Role } from './role.entity';
import { Endereco } from './endereco.entity';
import { PerfilUsuario } from './perfil-usuario.entity';

@Entity('usuarios')
export class Usuario extends BaseEntity {
  @Column({ type: 'varchar' })
  nome!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar', default: 'ATIVO' })
  status!: string; // 'ATIVO' | 'INATIVO' | 'SUSPENSO'

  // Agregação: Roles existem independentemente do Usuário
  @ManyToMany(() => Role, { cascade: true })
  @JoinTable({
    name: 'usuario_roles',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' }
  })
  roles!: Role[];

  // Composição: Endereços pertencem ao Usuário
  @OneToMany(() => Endereco, (endereco) => endereco.usuario, { 
    cascade: true,
    eager: false 
  })
  enderecos!: Endereco[];
  // Composição: Perfil é parte do Usuário (1:1)
  @OneToOne(() => PerfilUsuario, (perfil) => perfil.usuario, { 
    cascade: true,
    eager: false 
  })
  @JoinColumn()  // ✅ Adicionar JoinColumn aqui
  perfil!: PerfilUsuario;

  // === MÉTODOS DE DOMÍNIO RICO ===
  
  desativar(): void {
    this.status = 'INATIVO';
  }

  ativar(): void {
    this.status = 'ATIVO';
  }

  suspender(): void {
    this.status = 'SUSPENSO';
  }

  isAtivo(): boolean {
    return this.status === 'ATIVO';
  }

  isSuspenso(): boolean {
    return this.status === 'SUSPENSO';
  }

  adicionarEndereco(endereco: Endereco): void {
    if (!this.enderecos) {
      this.enderecos = [];
    }
    endereco.usuario = this;
    this.enderecos.push(endereco);
  }

  removerEndereco(enderecoId: string): void {
    if (this.enderecos) {
      this.enderecos = this.enderecos.filter(e => e.id !== enderecoId);
    }
  }

  adicionarRole(role: Role): void {
    if (!this.roles) {
      this.roles = [];
    }
    if (!this.roles.find(r => r.id === role.id)) {
      this.roles.push(role);
    }
  }

  removeRole(roleName: string): void {
    if (this.roles) {
      this.roles = this.roles.filter(r => r.nome !== roleName);
    }
  }

  hasRole(roleName: string): boolean {
    return this.roles?.some(r => r.nome === roleName) || false;
  }
}
