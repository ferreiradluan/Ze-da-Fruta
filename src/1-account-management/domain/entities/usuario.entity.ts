import { Entity, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { AggregateRoot } from '../../../common/domain/aggregate-root.base';
import { Role } from './role.entity';
import { Endereco } from './endereco.entity';
import { PerfilUsuario } from './perfil-usuario.entity';
import { BusinessRuleViolationException } from '../../../common/exceptions/business-rule-violation.exception';
import { CPF } from '../../../common/domain/value-objects/cpf.vo';
import { Senha } from '../../../common/domain/value-objects/senha.vo';
import { 
  UsuarioInvalidoError,
  EmailJaCadastradoError,
  CPFJaCadastradoError,
  UsuarioInativoError,
  SenhaInvalidaError,
  PerfilIncorretoError
} from '../errors/usuario.errors';
import { 
  UsuarioCriadoEvent,
  UsuarioAtualizadoEvent,
  UsuarioDesativadoEvent,
  UsuarioSuspensoEvent,
  SenhaAlteradaEvent,
  PerfilAtualizadoEvent
} from '../events';
import { DomainEventDispatcher } from '../../../common/domain/events/domain-event.base';

export enum StatusUsuario {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  SUSPENSO = 'SUSPENSO',
  PENDENTE_ATIVACAO = 'PENDENTE_ATIVACAO'
}

export enum TipoUsuario {
  CLIENTE = 'CLIENTE',
  LOJISTA = 'LOJISTA',
  ENTREGADOR = 'ENTREGADOR',
  ADMIN = 'ADMIN'
}

@Entity()
export class Usuario extends BaseEntity {
  private _aggregateRoot: AggregateRoot = new (class extends AggregateRoot {})();
  @Column()
  nome: string;

  @Column({ unique: true })
  email: string;

  @Column()
  senhaHash: string;

  @Column({ nullable: true })
  cpf?: string;

  @Column({ nullable: true })
  telefone?: string;

  @Column({ type: 'text', nullable: true })
  fotoPerfil?: string;

  @Column({
    type: 'text',
    default: StatusUsuario.PENDENTE_ATIVACAO,
  })
  status: StatusUsuario;

  @Column({
    type: 'text',
    default: TipoUsuario.CLIENTE
  })
  tipo: TipoUsuario;

  @Column({ nullable: true })
  dataUltimoLogin?: Date;

  @Column({ nullable: true })
  dataNascimento?: Date;

  @Column({ default: 0 })
  tentativasLogin: number;

  @Column({ nullable: true })
  dataUltimaTentativaLogin?: Date;

  @Column({ nullable: true })
  tokenVerificacao?: string;

  @Column({ nullable: true })
  tokenResetSenha?: string;

  @Column({ nullable: true })
  dataExpiracaoTokenReset?: Date;

  @Column({ default: false })
  emailVerificado: boolean;

  @Column({ default: false })
  telefoneVerificado: boolean;
  @ManyToMany(() => Role, { cascade: true })
  @JoinTable()
  roles: Role[];

  @OneToMany(() => Endereco, (endereco) => endereco.usuario, { cascade: true })
  enderecos: Endereco[];

  @OneToMany(() => PerfilUsuario, (perfil) => perfil.usuario, { cascade: true })
  perfis: PerfilUsuario[];

  // ===== MÉTODOS DE NEGÓCIO (RICH DOMAIN) =====
  static criar(dados: {
    nome: string;
    email: string;
    senha: string;
    tipo: TipoUsuario;
    cpf?: string;
    telefone?: string;
    dataNascimento?: Date;
  }): Usuario {
    const usuario = new Usuario();
    usuario.validarDadosObrigatorios(dados);
    
    usuario.nome = dados.nome.trim();
    usuario.email = dados.email.toLowerCase().trim();
    usuario.cpf = dados.cpf;
    usuario.telefone = dados.telefone;
    usuario.dataNascimento = dados.dataNascimento;
    usuario.tipo = dados.tipo;
    usuario.status = StatusUsuario.PENDENTE_ATIVACAO;
    usuario.emailVerificado = false;
    usuario.telefoneVerificado = false;
    usuario.tentativasLogin = 0;
    usuario.roles = [];
    usuario.enderecos = [];
    usuario.perfis = [];
    
    // Hash da senha
    usuario.definirSenha(dados.senha);
    
    // Gerar token de verificação
    usuario.gerarTokenVerificacao();

    // Disparar evento de criação de usuário
    const dispatcher = new DomainEventDispatcher();
    dispatcher.dispatch(new UsuarioCriadoEvent(
      usuario.id || '',
      usuario.email,
      usuario.nome,
      usuario.roles.map(role => role.nome)
    ));

    return usuario;
  }

  private validarDadosObrigatorios(dados: any): void {
    if (!dados.nome?.trim()) {
      throw new UsuarioInvalidoError('Nome é obrigatório');
    }
    
    if (!dados.email?.trim()) {
      throw new UsuarioInvalidoError('Email é obrigatório');
    }
    
    if (!this.validarEmailFormato(dados.email)) {
      throw new UsuarioInvalidoError('Email inválido');
    }
    
    if (!dados.senha) {
      throw new UsuarioInvalidoError('Senha é obrigatória');
    }    if (dados.cpf && !CPF.ehValido(dados.cpf)) {
      throw new UsuarioInvalidoError('CPF inválido');
    }
  }

  private validarEmailFormato(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }  // Gestão de Senha
  definirSenha(novaSenha: string): void {
    const senha = Senha.criar(novaSenha);
    this.senhaHash = senha.hashValue;
  }

  alterarSenha(senhaAtual: string, novaSenha: string): void {
    if (!this.verificarSenha(senhaAtual)) {
      throw new SenhaInvalidaError('Senha atual incorreta');
    }
    
    this.definirSenha(novaSenha);
    
    // Disparar evento de senha alterada
    const dispatcher = new DomainEventDispatcher();
    dispatcher.dispatch(new SenhaAlteradaEvent(
      this.id || '',
      this.email,
      'MUDANCA_VOLUNTARIA'
    ));
  }
  verificarSenha(senha: string): boolean {
    const senhaVO = Senha.criarDoHash(this.senhaHash);
    return senhaVO.verificar(senha);
  }

  resetarSenha(novaSenha: string): void {
    this.definirSenha(novaSenha);
    this.tokenResetSenha = undefined;
    this.dataExpiracaoTokenReset = undefined;
    this.tentativasLogin = 0;
    
    // Disparar evento de senha alterada
    const dispatcher = new DomainEventDispatcher();
    dispatcher.dispatch(new SenhaAlteradaEvent(
      this.id || '',
      this.email,
      'RESET'
    ));
  }

  // Gestão de Tokens
  gerarTokenVerificacao(): void {
    this.tokenVerificacao = this.gerarTokenAleatorio();
  }

  gerarTokenResetSenha(): void {
    this.tokenResetSenha = this.gerarTokenAleatorio();
    this.dataExpiracaoTokenReset = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
  }

  private gerarTokenAleatorio(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  validarTokenReset(token: string): boolean {
    if (!this.tokenResetSenha || !this.dataExpiracaoTokenReset) {
      return false;
    }
    
    if (this.dataExpiracaoTokenReset < new Date()) {
      return false; // Token expirado
    }
    
    return this.tokenResetSenha === token;
  }  desativar(motivo?: string) {
    if (this.status !== StatusUsuario.ATIVO) {
      throw new BusinessRuleViolationException('Usuário já está inativo.');
    }
    this.status = StatusUsuario.INATIVO;
    
    // Disparar evento de desativação
    const dispatcher = new DomainEventDispatcher();
    dispatcher.dispatch(new UsuarioDesativadoEvent(
      this.id || '',
      this.email,
      motivo
    ));
  }

  suspender(motivo: string, dataVencimento?: Date) {
    if (this.status === StatusUsuario.SUSPENSO) {
      throw new BusinessRuleViolationException('Usuário já está suspenso.');
    }
    this.status = StatusUsuario.SUSPENSO;
    
    // Disparar evento de suspensão
    const dispatcher = new DomainEventDispatcher();
    dispatcher.dispatch(new UsuarioSuspensoEvent(
      this.id || '',
      this.email,
      motivo,
      dataVencimento
    ));
  }

  ativar() {
    this.status = StatusUsuario.ATIVO;
    
    // Disparar evento de ativação
    const dispatcher = new DomainEventDispatcher();
    dispatcher.dispatch(new UsuarioAtualizadoEvent(
      this.id || '',
      this.email,
      ['status_ativado']
    ));
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
      return; // Role já existe
    }
    
    // Validações de negócio para roles
    this.validarAdicaoRole(role);
    
    this.roles.push(role);
    
    // Disparar evento de perfil atualizado
    const dispatcher = new DomainEventDispatcher();
    dispatcher.dispatch(new PerfilAtualizadoEvent(
      this.id || '',
      this.email,
      role.id || '',
      'ROLE_ADICIONADA'
    ));
  }

  private validarAdicaoRole(role: Role): void {
    // Regra: Cliente não pode ter role de admin/lojista ao mesmo tempo
    if (this.tipo === TipoUsuario.CLIENTE && 
        (role.nome === 'ADMIN' || role.nome === 'LOJISTA')) {
      throw new PerfilIncorretoError(
        'Cliente não pode ter perfil de administrador ou lojista'
      );
    }
    
    // Regra: Lojista não pode ter role de entregador
    if (this.tipo === TipoUsuario.LOJISTA && role.nome === 'ENTREGADOR') {
      throw new PerfilIncorretoError(
        'Lojista não pode ter perfil de entregador'
      );
    }
  }

  // ===== MÉTODOS DE NEGÓCIO ADICIONAIS =====

  // Gestão de Status e Ativação
  ativarConta(): void {
    if (this.status === StatusUsuario.ATIVO) {
      throw new UsuarioInvalidoError('Usuário já está ativo');
    }
    
    this.status = StatusUsuario.ATIVO;
    this.emailVerificado = true;
    this.tokenVerificacao = undefined;
    
    // Disparar evento de ativação
    const dispatcher = new DomainEventDispatcher();
    dispatcher.dispatch(new UsuarioAtualizadoEvent(
      this.id || '',
      this.email,
      ['status', 'emailVerificado']
    ));
  }

  suspenderPorTentativasExcessivas(): void {
    this.status = StatusUsuario.SUSPENSO;
    this.tentativasLogin = 0;
    this.dataUltimaTentativaLogin = new Date();
    
    // Disparar evento de suspensão
    const dispatcher = new DomainEventDispatcher();
    dispatcher.dispatch(new UsuarioSuspensoEvent(
      this.id || '',
      this.email,
      'Excesso de tentativas de login',
      new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
    ));
  }

  reativar(): void {
    if (this.status === StatusUsuario.ATIVO) {
      throw new UsuarioInvalidoError('Usuário já está ativo');
    }
    
    const statusAnterior = this.status;
    this.status = StatusUsuario.ATIVO;
    this.tentativasLogin = 0;
    this.dataUltimaTentativaLogin = undefined;
    
    // Disparar evento
    const dispatcher = new DomainEventDispatcher();
    dispatcher.dispatch(new UsuarioAtualizadoEvent(
      this.id || '',
      this.email,
      [`status_${statusAnterior}_para_ATIVO`]
    ));
  }

  // Gestão de Login e Segurança
  registrarTentativaLogin(sucesso: boolean): void {
    if (sucesso) {
      this.dataUltimoLogin = new Date();
      this.tentativasLogin = 0;
      this.dataUltimaTentativaLogin = undefined;
    } else {
      this.tentativasLogin++;
      this.dataUltimaTentativaLogin = new Date();
      
      // Suspender após 5 tentativas
      if (this.tentativasLogin >= 5) {
        this.suspenderPorTentativasExcessivas();
      }
    }
  }

  podeRealizarLogin(): boolean {
    if (this.status === StatusUsuario.INATIVO) {
      throw new UsuarioInativoError('Usuário está inativo');
    }
    
    if (this.status === StatusUsuario.SUSPENSO) {
      throw new UsuarioInativoError('Usuário está suspenso');
    }
    
    return this.status === StatusUsuario.ATIVO;
  }

  // Gestão de Perfis e Dados
  atualizarPerfil(dados: {
    nome?: string;
    telefone?: string;
    dataNascimento?: Date;
    fotoPerfil?: string;
  }): void {
    const camposAlterados: string[] = [];
    
    if (dados.nome && dados.nome !== this.nome) {
      this.nome = dados.nome.trim();
      camposAlterados.push('nome');
    }
    
    if (dados.telefone && dados.telefone !== this.telefone) {
      this.telefone = dados.telefone;
      camposAlterados.push('telefone');
      this.telefoneVerificado = false; // Requer nova verificação
    }
    
    if (dados.dataNascimento && dados.dataNascimento !== this.dataNascimento) {
      this.dataNascimento = dados.dataNascimento;
      camposAlterados.push('dataNascimento');
    }
    
    if (dados.fotoPerfil && dados.fotoPerfil !== this.fotoPerfil) {
      this.fotoPerfil = dados.fotoPerfil;
      camposAlterados.push('fotoPerfil');
    }
    
    if (camposAlterados.length > 0) {
      // Disparar evento de atualização
      const dispatcher = new DomainEventDispatcher();
      dispatcher.dispatch(new UsuarioAtualizadoEvent(
        this.id || '',
        this.email,
        camposAlterados
      ));
    }
  }

  alterarEmail(novoEmail: string): void {
    if (!this.validarEmailFormato(novoEmail)) {
      throw new UsuarioInvalidoError('Novo email inválido');
    }
    
    const emailAnterior = this.email;
    this.email = novoEmail.toLowerCase().trim();
    this.emailVerificado = false;
    this.gerarTokenVerificacao();
    
    // Disparar evento
    const dispatcher = new DomainEventDispatcher();
    dispatcher.dispatch(new UsuarioAtualizadoEvent(
      this.id || '',
      this.email,
      [`email_${emailAnterior}_para_${this.email}`]
    ));
  }

  verificarEmail(token: string): void {
    if (!this.tokenVerificacao || this.tokenVerificacao !== token) {
      throw new UsuarioInvalidoError('Token de verificação inválido');
    }
    
    this.emailVerificado = true;
    this.tokenVerificacao = undefined;
    
    // Se estava pendente de ativação, ativar automaticamente
    if (this.status === StatusUsuario.PENDENTE_ATIVACAO) {
      this.status = StatusUsuario.ATIVO;
    }
  }

  verificarTelefone(): void {
    if (!this.telefone) {
      throw new UsuarioInvalidoError('Usuário não possui telefone cadastrado');
    }
    
    this.telefoneVerificado = true;
  }

  // Gestão de Roles
  temRole(nomeRole: string): boolean {
    return this.roles?.some(role => role.nome === nomeRole) || false;
  }
  temPermissao(permissao: string): boolean {
    if (!this.roles) return false;
    
    // Para este domínio simples, mapeamos roles para permissões
    const permissoesPorRole: Record<string, string[]> = {
      'ADMIN': ['*'], // Admin tem todas as permissões
      'LOJISTA': ['produto.criar', 'produto.atualizar', 'produto.listar', 'pedido.gerenciar'],
      'ENTREGADOR': ['entrega.listar', 'entrega.atualizar'],
      'CLIENTE': ['pedido.criar', 'pedido.listar']
    };
    
    return this.roles.some(role => {
      const permissoesRole = permissoesPorRole[role.nome] || [];
      return permissoesRole.includes('*') || permissoesRole.includes(permissao);
    });
  }

  removerRole(role: Role): void {
    if (!this.roles) return;
    
    this.roles = this.roles.filter(r => r.id !== role.id);
  }

  // Validações de Negócio
  podeAlterarTipo(novoTipo: TipoUsuario): boolean {
    // Lógica de negócio para alteração de tipo
    if (this.tipo === TipoUsuario.ADMIN && novoTipo !== TipoUsuario.ADMIN) {
      // Verificar se não é o último admin
      return false; // Implementar lógica específica
    }
    
    return true;
  }

  alterarTipo(novoTipo: TipoUsuario): void {
    if (!this.podeAlterarTipo(novoTipo)) {
      throw new UsuarioInvalidoError('Não é possível alterar o tipo do usuário');
    }
    
    const tipoAnterior = this.tipo;
    this.tipo = novoTipo;
    
    // Disparar evento
    const dispatcher = new DomainEventDispatcher();
    dispatcher.dispatch(new UsuarioAtualizadoEvent(
      this.id || '',
      this.email,
      [`tipo_${tipoAnterior}_para_${novoTipo}`]
    ));
  }

  // Métodos de consulta
  estaAtivo(): boolean {
    return this.status === StatusUsuario.ATIVO;
  }

  estaSuspenso(): boolean {
    return this.status === StatusUsuario.SUSPENSO;
  }

  precisaVerificarEmail(): boolean {
    return !this.emailVerificado;
  }

  precisaVerificarTelefone(): boolean {
    return !!this.telefone && !this.telefoneVerificado;
  }

  getIdadeAproximada(): number | null {
    if (!this.dataNascimento) return null;
      const hoje = new Date();
    const nascimento = new Date(this.dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return idade;
  }

  // ===== DOMAIN EVENTS MANAGEMENT =====
  
  /**
   * Gets all uncommitted domain events
   */
  getUncommittedEvents(): any[] {
    return this._aggregateRoot.getUncommittedEvents();
  }

  /**
   * Marks all domain events as committed
   */
  markEventsAsCommitted(): void {
    this._aggregateRoot.markEventsAsCommitted();
  }

  /**
   * Adds a domain event to the aggregate
   */
  private addDomainEvent(domainEvent: any): void {
    (this._aggregateRoot as any).addDomainEvent(domainEvent);
  }

  /**
   * Clears all domain events
   */
  private clearDomainEvents(): void {
    (this._aggregateRoot as any).clearDomainEvents();
  }
}
