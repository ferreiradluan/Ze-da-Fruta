import { Entity, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { Role } from './role.entity';
import { Endereco } from './endereco.entity';
import { PerfilUsuario } from './perfil-usuario.entity';
import { BusinessRuleViolationException } from '../../../common/exceptions/business-rule-violation.exception';

export enum StatusUsuario {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  SUSPENSO = 'SUSPENSO',
}

@Entity()
export class Usuario extends BaseEntity {
  @Column()  @Column()
  nome: string;
  @Column({ unique: true })
  email: string;
  @Column({ type: 'text', nullable: true })
  fotoPerfil: string | null; // URL/caminho da foto de perfil

  @Column({
    type: 'text', // Corrige para SQLite
    default: StatusUsuario.ATIVO,
  })
  status: StatusUsuario;

  @ManyToMany(() => Role, { cascade: true })
  @JoinTable()
  roles: Role[];

  @OneToMany(() => Endereco, (endereco) => endereco.usuario, { cascade: true })
  enderecos: Endereco[];

  @OneToMany(() => PerfilUsuario, (perfil) => perfil.usuario, { cascade: true })
  perfis: PerfilUsuario[];
  desativar() {
    if (this.status !== StatusUsuario.ATIVO) {
      throw new BusinessRuleViolationException('Usuário já está inativo.');
    }
    this.status = StatusUsuario.INATIVO;
  }

  suspender() {
    if (this.status === StatusUsuario.SUSPENSO) {
      throw new BusinessRuleViolationException('Usuário já está suspenso.');
    }
    this.status = StatusUsuario.SUSPENSO;
  }

  ativar() {
    this.status = StatusUsuario.ATIVO;
  }

  alterarStatus(novoStatus: StatusUsuario) {
    if (!Object.values(StatusUsuario).includes(novoStatus)) {
      throw new BusinessRuleViolationException('Status inválido.');
    }
    this.status = novoStatus;
  }

  adicionarRole(role: Role) {
    if (!this.roles) this.roles = [];
    if (this.roles.find((r) => r.id === role.id)) {
      return;
    }
    this.roles.push(role);
  }
}
