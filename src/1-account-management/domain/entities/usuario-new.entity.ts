import { Entity, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { AggregateRoot } from '../../../common/domain/aggregate-root.base';
import { Role } from './role.entity';
import { Endereco } from './endereco.entity';
import { PerfilUsuario } from './perfil-usuario.entity';
import { CPF } from '../../../common/domain/value-objects/cpf.vo';
import { Senha } from '../../../common/domain/value-objects/senha.vo';
import { 
  UsuarioInvalidoError,
  SenhaInvalidaError,
  CredenciaisInvalidasError,
  UsuarioInativoError
} from '../errors/usuario.errors';
import { 
  UsuarioCriadoEvent,
  UsuarioAtualizadoEvent,
  UsuarioDesativadoEvent,
  UsuarioSuspensoEvent,
  SenhaAlteradaEvent,
  UsuarioPromovido,
  PerfilCompletoEvent,
  TentativaLoginEvent
} from '../events/usuario.events';
import * as bcrypt from 'bcrypt';

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

/**
 * Interface para dados de criação de usuário
 */
interface DadosCriacaoUsuario {
  nome: string;
  email: string;
  senha: string;
  tipo: TipoUsuario;
  cpf?: string;
  telefone?: string;
  dataNascimento?: Date;
}

/**
 * Interface para informações de contexto de login
 */
interface ContextoLogin {
  ip?: string;
  userAgent?: string;
  timestamp?: Date;
}

@Entity()
export class Usuario extends BaseEntity {
  // Composition pattern for aggregate root functionality
  private _aggregateRoot: AggregateRoot;

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

  @Column({
    type: 'varchar',
    enum: TipoUsuario,
    default: TipoUsuario.CLIENTE
  })
  tipo: TipoUsuario;

  @Column({
    type: 'varchar',
    enum: StatusUsuario,
    default: StatusUsuario.ATIVO
  })
  status: StatusUsuario;

  @Column({ type: 'date', nullable: true })
  dataNascimento?: Date;

  @Column({ default: false })
  emailVerificado: boolean;

  @Column({ default: false })
  telefoneVerificado: boolean;

  @Column({ nullable: true })
  tokenResetSenha?: string;

  @Column({ type: 'datetime', nullable: true })
  tokenResetExpiracao?: Date;

  @Column({ nullable: true })
  dataUltimoLogin?: Date;

  @Column({ default: 0 })
  tentativasLoginFalhas: number;

  @Column({ nullable: true })
  suspensoAte?: Date;

  @Column({ nullable: true })
  motivoSuspensao?: string;

  @Column({ nullable: true })
  observacoes?: string;

  @ManyToMany(() => Role, role => role.usuarios, { cascade: true })
  @JoinTable()
  roles: Role[];

  @OneToMany(() => Endereco, endereco => endereco.usuario, { cascade: true })
  enderecos: Endereco[];

  @OneToMany(() => PerfilUsuario, perfil => perfil.usuario, { cascade: true })
  perfis: PerfilUsuario[];

  constructor() {
    super();
    this._aggregateRoot = new AggregateRoot(this.id || '');
    this.roles = [];
    this.enderecos = [];
    this.perfis = [];
  }

  // ===== FACTORY METHODS =====

  /**
   * Factory method para criar um novo usuário
   */
  static async criar(dados: DadosCriacaoUsuario): Promise<Usuario> {
    const usuario = new Usuario();
    
    // Validar dados
    usuario.validarDadosCriacao(dados);

    // Definir propriedades básicas
    usuario.nome = dados.nome;
    usuario.email = dados.email.toLowerCase();
    usuario.tipo = dados.tipo;
    usuario.status = StatusUsuario.PENDENTE_ATIVACAO;
    
    // Validar e definir CPF se fornecido
    if (dados.cpf) {
      const cpfVO = new CPF(dados.cpf);
      usuario.cpf = cpfVO.toClean();
    }

    usuario.telefone = dados.telefone;
    usuario.dataNascimento = dados.dataNascimento;

    // Criptografar senha
    await usuario.definirSenha(dados.senha);

    // Gerar eventos de domínio
    usuario.adicionarEventoDominio(new UsuarioCriadoEvent(
      usuario.id,
      {
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        cpf: usuario.cpf,
        telefone: usuario.telefone
      }
    ));

    return usuario;
  }

  // ===== BUSINESS METHODS =====

  /**
   * Ativa a conta do usuário
   */
  ativar(): void {
    if (this.status === StatusUsuario.ATIVO) {
      throw new UsuarioInvalidoError('Usuário já está ativo');
    }

    const statusAnterior = this.status;
    this.status = StatusUsuario.ATIVO;
    this.tentativasLoginFalhas = 0;
    this.suspensoAte = null;
    this.motivoSuspensao = null;

    this.adicionarEventoDominio(new UsuarioAtualizadoEvent(
      this.id,
      {
        camposAlterados: ['status'],
        valoresAnteriores: { status: statusAnterior },
        valoresNovos: { status: this.status }
      }
    ));
  }

  /**
   * Desativa a conta do usuário
   */
  desativar(motivo?: string): void {
    if (this.status === StatusUsuario.INATIVO) {
      throw new UsuarioInvalidoError('Usuário já está inativo');
    }

    this.status = StatusUsuario.INATIVO;
    this.observacoes = motivo;

    this.adicionarEventoDominio(new UsuarioDesativadoEvent(
      this.id,
      {
        motivo,
        dataDesativacao: new Date()
      }
    ));
  }

  /**
   * Suspende o usuário até uma data específica
   */
  suspender(motivo: string, suspensoAte?: Date): void {
    if (this.status === StatusUsuario.INATIVO) {
      throw new UsuarioInvalidoError('Não é possível suspender usuário inativo');
    }

    this.status = StatusUsuario.SUSPENSO;
    this.motivoSuspensao = motivo;
    this.suspensoAte = suspensoAte;

    this.adicionarEventoDominio(new UsuarioSuspensoEvent(
      this.id,
      {
        motivo,
        dataFimSuspensao: suspensoAte,
        suspensoAte
      }
    ));
  }

  /**
   * Altera a senha do usuário
   */
  async alterarSenha(senhaAtual: string, novaSenha: string): Promise<void> {
    // Verificar senha atual
    if (!(await this.verificarSenha(senhaAtual))) {
      throw new CredenciaisInvalidasError('Senha atual incorreta');
    }

    // Validar nova senha
    const validacao = Senha.getStrengthScore(novaSenha);
    if (validacao < 70) {
      throw new SenhaInvalidaError('Nova senha não atende aos critérios de segurança');
    }

    // Verificar se é diferente da atual
    if (await this.verificarSenha(novaSenha)) {
      throw new SenhaInvalidaError('Nova senha deve ser diferente da atual');
    }

    const forcaAnterior = this.senhaHash ? 70 : 0; // estimativa
    await this.definirSenha(novaSenha);
    const forcaNova = Senha.getStrengthScore(novaSenha);

    this.adicionarEventoDominio(new SenhaAlteradaEvent(
      this.id,
      {
        alteradoPeloUsuario: true,
        dataAlteracao: new Date(),
        forcaAnterior,
        forcaNova
      }
    ));
  }

  /**
   * Reset de senha usando token
   */
  async resetarSenha(novaSenha: string): Promise<void> {
    if (!this.tokenResetSenha || !this.tokenResetExpiracao) {
      throw new CredenciaisInvalidasError('Token de reset não encontrado');
    }

    if (new Date() > this.tokenResetExpiracao) {
      throw new CredenciaisInvalidasError('Token de reset expirado');
    }

    const forcaAnterior = this.senhaHash ? 70 : 0;
    await this.definirSenha(novaSenha);
    const forcaNova = Senha.getStrengthScore(novaSenha);

    // Limpar token
    this.tokenResetSenha = null;
    this.tokenResetExpiracao = null;
    this.tentativasLoginFalhas = 0;

    this.adicionarEventoDominio(new SenhaAlteradaEvent(
      this.id,
      {
        alteradoPeloUsuario: false,
        dataAlteracao: new Date(),
        forcaAnterior,
        forcaNova
      }
    ));
  }

  /**
   * Verifica a senha do usuário
   */
  async verificarSenha(senha: string): Promise<boolean> {
    if (!this.senhaHash) {
      return false;
    }
    return bcrypt.compare(senha, this.senhaHash);
  }

  /**
   * Registra uma tentativa de login
   */
  registrarTentativaLogin(sucesso: boolean, contexto?: ContextoLogin): void {
    if (sucesso) {
      this.dataUltimoLogin = new Date();
      this.tentativasLoginFalhas = 0;
    } else {
      this.tentativasLoginFalhas++;
    }

    this.adicionarEventoDominio(new TentativaLoginEvent(
      this.id,
      {
        sucesso,
        dataIniciativa: new Date(),
        ip: contexto?.ip,
        userAgent: contexto?.userAgent
      }
    ));
  }

  /**
   * Altera o tipo do usuário
   */
  alterarTipo(novoTipo: TipoUsuario, motivo?: string): void {
    if (this.tipo === novoTipo) {
      throw new UsuarioInvalidoError('Usuário já possui este tipo');
    }

    const tipoAnterior = this.tipo;
    this.tipo = novoTipo;

    this.adicionarEventoDominio(new UsuarioPromovido(
      this.id,
      {
        tipoAnterior,
        tipoNovo: novoTipo,
        dataPromocao: new Date(),
        motivo
      }
    ));
  }

  /**
   * Adiciona uma role ao usuário
   */
  adicionarRole(role: Role): void {
    if (this.roles.some(r => r.id === role.id)) {
      return; // Já possui a role
    }

    this.roles.push(role);
  }

  /**
   * Remove uma role do usuário
   */
  removerRole(role: Role): void {
    this.roles = this.roles.filter(r => r.id !== role.id);
  }

  /**
   * Gera token para reset de senha
   */
  gerarTokenResetSenha(): string {
    this.tokenResetSenha = this.gerarTokenAleatorio();
    this.tokenResetExpiracao = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    return this.tokenResetSenha;
  }

  /**
   * Valida token de reset de senha
   */
  validarTokenReset(token: string): boolean {
    return this.tokenResetSenha === token && 
           this.tokenResetExpiracao && 
           new Date() <= this.tokenResetExpiracao;
  }

  /**
   * Verifica email do usuário
   */
  verificarEmail(): void {
    this.emailVerificado = true;
  }

  /**
   * Verifica telefone do usuário
   */
  verificarTelefone(): void {
    this.telefoneVerificado = true;
  }

  // ===== QUERY METHODS =====

  /**
   * Verifica se o usuário está ativo
   */
  estaAtivo(): boolean {
    return this.status === StatusUsuario.ATIVO;
  }

  /**
   * Verifica se o usuário está suspenso
   */
  estaSuspenso(): boolean {
    if (this.status !== StatusUsuario.SUSPENSO) {
      return false;
    }

    // Verificar se a suspensão expirou
    if (this.suspensoAte && new Date() > this.suspensoAte) {
      this.status = StatusUsuario.ATIVO;
      this.suspensoAte = null;
      this.motivoSuspensao = null;
      return false;
    }

    return true;
  }

  /**
   * Verifica se o usuário pode realizar login
   */
  podeRealizarLogin(): boolean {
    return this.estaAtivo() && !this.estaSuspenso();
  }

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  temPermissao(permissao: string): boolean {
    return this.roles.some(role => 
      role.nome === 'ADMIN' || 
      role.nome.includes(permissao.toUpperCase())
    );
  }

  /**
   * Verifica se o perfil está completo
   */
  perfilCompleto(): boolean {
    const camposObrigatorios = [
      this.nome,
      this.email,
      this.telefone
    ];

    const completo = camposObrigatorios.every(campo => campo && campo.trim() !== '');

    if (completo && !this.emailVerificado) {
      // Disparar evento de perfil completo apenas uma vez
      this.adicionarEventoDominio(new PerfilCompletoEvent(
        this.id,
        {
          dataCompleto: new Date(),
          camposCompletados: ['nome', 'email', 'telefone']
        }
      ));
    }

    return completo;
  }

  // ===== GETTERS =====

  getId(): string {
    return this.id;
  }

  getNome(): string {
    return this.nome;
  }

  getEmail(): string {
    return this.email;
  }

  getTipo(): TipoUsuario {
    return this.tipo;
  }

  getStatus(): StatusUsuario {
    return this.status;
  }

  getCpf(): string | undefined {
    return this.cpf;
  }

  getTelefone(): string | undefined {
    return this.telefone;
  }

  getDataNascimento(): Date | undefined {
    return this.dataNascimento;
  }

  getEmailVerificado(): boolean {
    return this.emailVerificado;
  }

  getTelefoneVerificado(): boolean {
    return this.telefoneVerificado;
  }

  getDataUltimoLogin(): Date | undefined {
    return this.dataUltimoLogin;
  }

  getTentativasLoginFalhas(): number {
    return this.tentativasLoginFalhas;
  }

  getRoles(): Role[] {
    return [...this.roles];
  }

  getEnderecos(): Endereco[] {
    return [...this.enderecos];
  }

  getPerfis(): PerfilUsuario[] {
    return [...this.perfis];
  }

  // ===== AGGREGATE ROOT METHODS =====

  get domainEvents() {
    return this._aggregateRoot.domainEvents;
  }

  adicionarEventoDominio(event: any): void {
    this._aggregateRoot.addDomainEvent(event);
  }

  limparEventosDominio(): void {
    this._aggregateRoot.clearDomainEvents();
  }

  marcarEventosComoDispachados(): void {
    this._aggregateRoot.markEventsAsDispatched();
  }

  // ===== PRIVATE METHODS =====

  private validarDadosCriacao(dados: DadosCriacaoUsuario): void {
    if (!dados.nome || dados.nome.trim().length < 2) {
      throw new UsuarioInvalidoError('Nome deve ter pelo menos 2 caracteres');
    }

    if (!dados.email || !this.validarEmail(dados.email)) {
      throw new UsuarioInvalidoError('Email inválido');
    }

    if (!dados.senha || dados.senha.length < 8) {
      throw new SenhaInvalidaError('Senha deve ter pelo menos 8 caracteres');
    }

    if (dados.cpf) {
      try {
        new CPF(dados.cpf);
      } catch (error) {
        throw new UsuarioInvalidoError('CPF inválido');
      }
    }
  }

  private validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async definirSenha(senha: string): Promise<void> {
    const saltRounds = 12;
    this.senhaHash = await bcrypt.hash(senha, saltRounds);
  }

  private gerarTokenAleatorio(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}
