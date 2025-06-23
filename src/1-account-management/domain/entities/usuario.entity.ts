import { Entity, Column, ManyToMany, OneToMany, OneToOne, JoinTable, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { Role } from './role.entity';
import { Endereco } from './endereco.entity';
import { PerfilUsuario } from './perfil-usuario.entity';
import { UsuarioPromovido, UsuarioStatusAlteradoEvent } from '../events/usuario.events';
import { DomainEvent } from '../../../common/domain/events/domain-event';
import { ROLE_NAMES } from '../types/role.types';
import { STATUS_USUARIO, StatusUsuario } from '../types/status-usuario.types';

@Entity('usuarios')
export class Usuario extends BaseEntity {
  @Column({ type: 'varchar' })
  nome!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar', nullable: true })
  googleId?: string;
  @Column({ type: 'varchar', default: STATUS_USUARIO.PENDENTE })
  status!: StatusUsuario;

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
  })  @JoinColumn()  // ✅ Adicionar JoinColumn aqui
  perfil!: PerfilUsuario;

  // ===== DOMAIN EVENTS =====
  private domainEvents: DomainEvent[] = [];

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }
  // === MÉTODOS DE DOMÍNIO RICO ===
    desativar(): void {
    const statusAnterior = this.status;
    this.status = STATUS_USUARIO.INATIVO;

    // Disparar evento de mudança de status
    this.addDomainEvent(new UsuarioStatusAlteradoEvent(
      this.id || '',
      statusAnterior,
      this.status
    ));
  }

  ativar(): void {
    const statusAnterior = this.status;
    this.status = STATUS_USUARIO.ATIVO;

    // Disparar evento de mudança de status
    this.addDomainEvent(new UsuarioStatusAlteradoEvent(
      this.id || '',
      statusAnterior,
      this.status
    ));
  }

  suspender(): void {
    const statusAnterior = this.status;
    this.status = STATUS_USUARIO.SUSPENSO;

    // Disparar evento de mudança de status
    this.addDomainEvent(new UsuarioStatusAlteradoEvent(
      this.id || '',
      statusAnterior,
      this.status
    ));
  }

  isAtivo(): boolean {
    return this.status === STATUS_USUARIO.ATIVO;
  }

  isSuspenso(): boolean {
    return this.status === STATUS_USUARIO.SUSPENSO;
  }

  isPendente(): boolean {
    return this.status === STATUS_USUARIO.PENDENTE;
  }

  aprovar(): void {
    if (this.status !== STATUS_USUARIO.PENDENTE) {
      throw new Error('Apenas usuários pendentes podem ser aprovados');
    }
    
    const statusAnterior = this.status;
    this.status = STATUS_USUARIO.ATIVO;

    // Disparar evento de mudança de status
    this.addDomainEvent(new UsuarioStatusAlteradoEvent(
      this.id || '',
      statusAnterior,
      this.status
    ));
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

  // ===== MÉTODOS DE NEGÓCIO ESPECÍFICOS POR TIPO =====
  promoverALojista(): void {
    // Validar pré-requisitos antes de promover
    const validacao = this.validarParaPromocao();
    if (!validacao.valido) {
      throw new Error(`Não é possível promover usuário: ${validacao.motivos.join(', ')}`);
    }    if (this.hasRole(ROLE_NAMES.LOJISTA)) {
      throw new Error('Usuário já é um lojista');
    }

    // Criar e adicionar role de lojista
    const roleLojista = new Role();
    roleLojista.nome = ROLE_NAMES.LOJISTA;
    roleLojista.descricao = 'Vendedor/Parceiro da plataforma';
    roleLojista.ativa = true;
    
    this.adicionarRole(roleLojista);
  }
  rebaixarParaCliente(): void {
    if (!this.hasRole(ROLE_NAMES.LOJISTA)) {
      throw new Error('Usuário não é um lojista');
    }

    this.removeRole(ROLE_NAMES.LOJISTA);
    this.removeRole(ROLE_NAMES.ENTREGADOR); // Remove outras roles comerciais também

    // Garantir que tenha pelo menos role de cliente
    if (!this.hasRole(ROLE_NAMES.CLIENTE)) {
      const roleCliente = new Role();
      roleCliente.nome = ROLE_NAMES.CLIENTE;
      roleCliente.descricao = 'Cliente da plataforma';
      roleCliente.ativa = true;
      
      this.adicionarRole(roleCliente);
    }
  }

  definirEnderecoPrincipal(enderecoId: string): void {
    if (!this.enderecos || this.enderecos.length === 0) {
      throw new Error('Usuário não possui endereços cadastrados');
    }

    const endereco = this.enderecos.find(e => e.id === enderecoId);
    if (!endereco) {
      throw new Error('Endereço não encontrado');
    }

    if (!endereco.isAtivo()) {
      throw new Error('Não é possível definir um endereço inativo como principal');
    }

    // Remover principal de outros endereços
    this.enderecos.forEach(e => {
      if (e.principal) {
        e.principal = false;
      }
    });

    // Definir o novo principal
    endereco.definirComoPrincipal();
  }

  // ===== VALIDAÇÕES DE NEGÓCIO =====
  podeRealizarPedido(): boolean {
    const validacoes = [
      { condicao: this.isAtivo(), erro: 'Usuário deve estar ativo' },
      { condicao: this.hasRole('CLIENTE'), erro: 'Usuário deve ter permissão de cliente' },
      { condicao: this.temEnderecoEntrega(), erro: 'Usuário deve ter endereço de entrega' },
      { condicao: this.perfil?.isCompleto() || false, erro: 'Perfil deve estar completo' },
      { condicao: this.perfil?.emailVerificado || false, erro: 'Email deve estar verificado' }
    ];

    return validacoes.every(v => v.condicao);
  }

  // Versão detalhada para debugging/logs
  validarParaPedido(): { valido: boolean; motivos: string[] } {
    const motivos: string[] = [];

    if (!this.isAtivo()) motivos.push('Usuário deve estar ativo');
    if (!this.hasRole('CLIENTE')) motivos.push('Usuário deve ter permissão de cliente');
    if (!this.temEnderecoEntrega()) motivos.push('Usuário deve ter endereço de entrega');
    if (!this.perfil?.isCompleto()) motivos.push('Perfil deve estar completo');
    if (!this.perfil?.emailVerificado) motivos.push('Email deve estar verificado');

    return {
      valido: motivos.length === 0,
      motivos
    };
  }

  temEnderecoEntrega(): boolean {
    return this.enderecos?.some(e => e.isAtivo()) || false;
  }
  isLojista(): boolean {
    return this.hasRole(ROLE_NAMES.LOJISTA);
  }

  isEntregador(): boolean {
    return this.hasRole(ROLE_NAMES.ENTREGADOR);
  }

  isAdmin(): boolean {
    return this.hasRole(ROLE_NAMES.ADMIN);
  }

  isCliente(): boolean {
    return this.hasRole('CLIENTE');
  }

  podeGerenciarLoja(): boolean {
    return this.isAtivo() && this.isLojista();
  }

  podeRealizarEntregas(): boolean {
    return this.isAtivo() && this.isEntregador();
  }

  obterEnderecoPrincipal(): Endereco | undefined {
    return this.enderecos?.find(e => e.isPrincipal() && e.isAtivo());
  }

  validarParaPromocao(): { valido: boolean; motivos: string[] } {
    const motivos: string[] = [];

    if (!this.isAtivo()) {
      motivos.push('Usuário deve estar ativo');
    }

    if (!this.perfil?.isCompleto()) {
      motivos.push('Perfil deve estar completo');
    }

    if (!this.perfil?.emailVerificado) {
      motivos.push('Email deve estar verificado');
    }

    if (!this.temEnderecoEntrega()) {
      motivos.push('Deve ter pelo menos um endereço ativo');
    }

    return {
      valido: motivos.length === 0,
      motivos
    };
  }
}
