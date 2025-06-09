import { Injectable } from '@nestjs/common';
import { Usuario, TipoUsuario, StatusUsuario } from '../entities/usuario.entity';
import { IUsuarioRepository } from '../repositories/usuario.repository.interface';
import { CPF } from '../../../common/domain/value-objects/cpf.vo';
import { Senha } from '../../../common/domain/value-objects/senha.vo';
import { DomainEventDispatcher } from '../../../common/domain/events/domain-event.base';
import { 
  EmailJaCadastradoError, 
  CPFJaCadastradoError, 
  UsuarioInativoError,
  UsuarioSuspensoError,
  SenhaIncorretaError,
  OperacaoNaoPermitidaError,
  CredenciaisInvalidasError
} from '../errors/usuario.errors';

/**
 * Interface para contexto de operação
 */
export interface IOperationContext {
  executorId?: string;
  executorTipo?: TipoUsuario;
  ip?: string;
  userAgent?: string;
  lojistaId?: string;
  clienteId?: string;
}

/**
 * Interface para dados de criação de usuário
 */
export interface ICriarUsuarioData {
  nome: string;
  email: string;
  senha: string;
  tipo: TipoUsuario;
  cpf?: string;
  telefone?: string;
  endereco?: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
}

/**
 * Serviço de domínio para operações complexas do Usuario
 * Contém lógica de negócio que não pertence a uma única entidade
 */
@Injectable()
export class UsuarioDomainService {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly eventDispatcher: DomainEventDispatcher
  ) {}
  /**
   * Cria um novo usuário com validações completas
   */
  async criarUsuario(data: ICriarUsuarioData, contexto?: IOperationContext): Promise<Usuario> {
    // Validar unicidade do email
    if (await this.usuarioRepository.emailExists(data.email)) {
      throw new EmailJaCadastradoError(data.email);
    }

    // Validar unicidade do CPF se fornecido
    if (data.cpf && await this.usuarioRepository.cpfExists(data.cpf)) {
      throw new CPFJaCadastradoError(data.cpf);
    }

    // Criar usuário usando o método estático da entidade
    const usuario = Usuario.criar({
      nome: data.nome,
      email: data.email,
      senha: data.senha, // A entidade cuida da conversão
      tipo: data.tipo,
      cpf: data.cpf,
      telefone: data.telefone
    });

    // Salvar e disparar eventos
    const usuarioSalvo = await this.usuarioRepository.saveAggregate(usuario);
    
    return usuarioSalvo;
  }
  /**
   * Realiza login do usuário com validações
   */
  async realizarLogin(
    email: string, 
    senhaPlainText: string, 
    contexto?: IOperationContext
  ): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findByEmail(email);
    
    if (!usuario) {
      throw new CredenciaisInvalidasError();
    }

    // Verificar se usuário pode realizar login (já faz as validações internas)
    try {
      usuario.podeRealizarLogin();
    } catch (error) {
      throw error;
    }

    // Validar senha
    const senhaValida = usuario.verificarSenha(senhaPlainText);
    
    if (!senhaValida) {
      // Registrar tentativa de login falhosa
      usuario.registrarTentativaLogin(false);
      await this.usuarioRepository.saveAggregate(usuario);
      throw new SenhaIncorretaError();
    }

    // Registrar login bem-sucedido
    usuario.registrarTentativaLogin(true);
    await this.usuarioRepository.saveAggregate(usuario);

    return usuario;
  }
  /**
   * Altera senha do usuário com validações
   */
  async alterarSenha(
    usuarioId: string, 
    senhaAtual: string, 
    novaSenha: string,
    contexto?: IOperationContext
  ): Promise<void> {
    const usuario = await this.usuarioRepository.findById(usuarioId);
    
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    // Validar senha atual usando o método da entidade
    if (!usuario.verificarSenha(senhaAtual)) {
      throw new SenhaIncorretaError();
    }

    // Alterar senha usando o método da entidade
    usuario.alterarSenha(senhaAtual, novaSenha);

    await this.usuarioRepository.saveAggregate(usuario);
  }
  /**
   * Redefine senha do usuário (admin operation)
   */
  async redefinirSenha(
    usuarioId: string, 
    novaSenha: string,
    contexto?: IOperationContext
  ): Promise<void> {
    const usuario = await this.usuarioRepository.findById(usuarioId);
    
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar permissões
    if (!this.podeRedefinirSenha(contexto)) {
      throw new OperacaoNaoPermitidaError('Não é possível redefinir senha');
    }

    // Usar o método resetarSenha da entidade
    usuario.resetarSenha(novaSenha);

    await this.usuarioRepository.saveAggregate(usuario);
  }
  /**
   * Promove usuário para outro tipo
   */
  async promoverUsuario(
    usuarioId: string, 
    novoTipo: TipoUsuario,
    motivo?: string,
    contexto?: IOperationContext
  ): Promise<void> {
    const usuario = await this.usuarioRepository.findById(usuarioId);
    
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar permissões
    if (!this.podePromoverUsuario(contexto, novoTipo)) {
      throw new OperacaoNaoPermitidaError('Não é possível promover usuário');
    }

    // Usar o método alterarTipo da entidade
    usuario.alterarTipo(novoTipo);
    await this.usuarioRepository.saveAggregate(usuario);
  }

  /**
   * Suspende usuário
   */
  async suspenderUsuario(
    usuarioId: string, 
    motivo: string,
    dataFim?: Date,
    contexto?: IOperationContext
  ): Promise<void> {
    const usuario = await this.usuarioRepository.findById(usuarioId);
    
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar permissões
    if (!this.podeSuspenderUsuario(contexto)) {
      throw new OperacaoNaoPermitidaError('Não é possível suspender usuário');
    }

    usuario.suspender(motivo, dataFim);
    await this.usuarioRepository.saveAggregate(usuario);
  }

  /**
   * Ativa usuário suspenso
   */
  async ativarUsuario(usuarioId: string, contexto?: IOperationContext): Promise<void> {
    const usuario = await this.usuarioRepository.findById(usuarioId);
    
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar permissões
    if (!this.podeAtivarUsuario(contexto)) {
      throw new OperacaoNaoPermitidaError('Não é possível ativar usuário');
    }

    usuario.ativar();
    await this.usuarioRepository.saveAggregate(usuario);
  }

  /**
   * Desativa usuário
   */
  async desativarUsuario(
    usuarioId: string, 
    motivo?: string,
    contexto?: IOperationContext
  ): Promise<void> {
    const usuario = await this.usuarioRepository.findById(usuarioId);
    
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar permissões
    if (!this.podeDesativarUsuario(contexto)) {
      throw new OperacaoNaoPermitidaError('Não é possível desativar usuário');
    }

    usuario.desativar(motivo);
    await this.usuarioRepository.saveAggregate(usuario);
  }
  /**
   * Calcula score de segurança do usuário
   */
  calcularScoreSeguranca(usuario: Usuario): number {
    let score = 0;

    // Pontuação base por completude do perfil
    if (usuario.nome && usuario.nome.length > 2) score += 10;
    if (usuario.email) score += 10;
    if (usuario.cpf) score += 15;
    if (usuario.telefone) score += 10;
    if (usuario.enderecos && usuario.enderecos.length > 0) score += 15;

    // Pontuação por atividade
    if (usuario.dataUltimoLogin) {
      const diasSemLogin = Math.floor(
        (Date.now() - usuario.dataUltimoLogin.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (diasSemLogin < 7) score += 20;
      else if (diasSemLogin < 30) score += 10;
      else if (diasSemLogin < 90) score += 5;
    }

    // Pontuação por histórico
    if (usuario.status === StatusUsuario.ATIVO) score += 20;
    if (usuario.tipo === TipoUsuario.LOJISTA) score += 10;

    return Math.min(100, score);
  }

  // Métodos privados para validação de permissões

  private podeRedefinirSenha(contexto?: IOperationContext): boolean {
    return contexto?.executorTipo === TipoUsuario.ADMIN;
  }

  private podePromoverUsuario(contexto?: IOperationContext, novoTipo?: TipoUsuario): boolean {
    if (contexto?.executorTipo === TipoUsuario.ADMIN) return true;
    
    // Lojistas podem promover clientes para lojistas apenas em seu contexto
    if (contexto?.executorTipo === TipoUsuario.LOJISTA && 
        novoTipo === TipoUsuario.LOJISTA &&
        contexto.lojistaId === contexto.executorId) {
      return true;
    }

    return false;
  }

  private podeSuspenderUsuario(contexto?: IOperationContext): boolean {
    return contexto?.executorTipo === TipoUsuario.ADMIN;
  }

  private podeAtivarUsuario(contexto?: IOperationContext): boolean {
    return contexto?.executorTipo === TipoUsuario.ADMIN;
  }

  private podeDesativarUsuario(contexto?: IOperationContext): boolean {
    return contexto?.executorTipo === TipoUsuario.ADMIN;
  }
}