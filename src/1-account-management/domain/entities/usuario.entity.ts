import { Entity, Column, ManyToMany, JoinTable, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { Role } from './role.entity';
import { Endereco } from './endereco.entity';
import { PerfilUsuario } from './perfil-usuario.entity';
import { BusinessRuleViolationException } from '../../../common/exceptions/business-rule-violation.exception';

@Entity()
export class Usuario extends BaseEntity {
  @Column()
  nome: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'text', default: 'ATIVO' })
  status: string;

  // Agregação: Roles existem independentemente do Usuário
  @ManyToMany(() => Role, { cascade: true })
  @JoinTable()
  roles: Role[];

  // Composição: Endereços pertencem ao Usuário
  @OneToMany(() => Endereco, (endereco) => endereco.usuario, { cascade: true })
  enderecos: Endereco[];

  // Composição: Perfil é parte do Usuário (1:1)
  @OneToOne(() => PerfilUsuario, (perfil) => perfil.usuario, { cascade: true })
  @JoinColumn()
  perfil: PerfilUsuario;
  // Métodos de negócio conforme diagrama
  desativar(): void {
    if (this.status !== 'ATIVO') {
      throw new BusinessRuleViolationException('Usuário já está inativo.');
    }
    this.status = 'INATIVO';
  }

  adicionarEndereco(dadosEndereco: any): void {
    if (!this.enderecos) this.enderecos = [];
    const endereco = new Endereco();
    Object.assign(endereco, dadosEndereco);
    endereco.usuario = this;
    this.enderecos.push(endereco);
  }

  removerEndereco(enderecoId: string): void {
    if (!this.enderecos) return;
    this.enderecos = this.enderecos.filter(endereco => endereco.id !== enderecoId);
  }

  adicionarRole(role: Role): void {
    if (!this.roles) this.roles = [];
    if (this.roles.find((r) => r.id === role.id)) {
      return; // Role já existe
    }
    this.roles.push(role);
  }
}
