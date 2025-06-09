import { Injectable } from '@nestjs/common';
import { Usuario, TipoUsuario, StatusUsuario } from '../entities/usuario.entity';
import { CPF } from '../../../common/domain/value-objects/cpf.vo';
import { Senha } from '../../../common/domain/value-objects/senha.vo';
import { IUsuarioRepository } from '../repositories/usuario.repository.interface';
import { 
  EmailJaCadastradoError, 
  CPFJaCadastradoError,
  UsuarioInativoError,
  CredenciaisInvalidasError,
  UsuarioNaoEncontradoError,
  SenhaFracaError,
  UsuarioSuspensoError
} from '../errors/usuario.errors';
import { DomainEventDispatcher } from '../../../common/domain/events/domain-event.base';
import { Role } from '../entities/role.entity';

/**
 * Contexto de autenticação para operações que requerem verificação de permissões
 */
export interface ContextoAutenticacao {
  usuarioId: string;
  tipo: string;
  roles: string[];
  clienteId?: string;
  lojistaId?: string;
}

/**
 * Interface para validação de força de senha
 */
interface ValidacaoSenha {
  valida: boolean;
  requisitos: string[];
  score: number;
}

/**
 * Serviço de domínio para operações complexas envolvendo Usuario
 * que não podem ser encapsuladas em uma única entidade
 */
@Injectable()
export class UsuarioDomainService {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly eventDispatcher: DomainEventDispatcher
  ) {}

  /**
   * Verifica se um usuário pode ser criado com os dados fornecidos
   * Inclui validação de unicidade de email e CPF
   */
  async validarCriacaoUsuario(
    dados: {
      email: string;
      cpf?: string;
    }
  ): Promise<void> {
    // Verificar se email já existe
    if (await this.usuarioRepository.emailExists(dados.email)) {
      throw new EmailJaCadastradoError(dados.email);
    }
    
    // Verificar se CPF já existe (se fornecido)
    if (dados.cpf && await this.usuarioRepository.cpfExists(dados.cpf)) {
      throw new CPFJaCadastradoError(dados.cpf);
    }
  }

  /**
   * Cria um usuário com validações completas de domínio
   */
  async criarUsuarioCompleto(
    dados: {
      nome: string;
      email: string;
      senha: string;
      tipo: TipoUsuario;
      cpf?: string;
      telefone?: string;
      dataNascimento?: Date;
    }
  ): Promise<Usuario> {
    // Validar unicidade
    await this.validarCriacaoUsuario({
      email: dados.email,
      cpf: dados.cpf
    });

    // Validar força da senha
    const validacaoSenha = this.validarForcaSenha(dados.senha);
    if (!validacaoSenha.valida) {
      throw new SenhaFracaError(validacaoSenha.requisitos);
    }

    // Criar usuário usando o método de factory da entidade
    const usuario = Usuario.criar({
      nome: dados.nome,
      email: dados.email,
      senha: dados.senha,
      tipo: dados.tipo,
      cpf: dados.cpf,
      telefone: dados.telefone,
      dataNascimento: dados.dataNascimento
    });

    return usuario;
  }

  /**
   * Processo completo de alteração de senha com validações
   */
  async alterarSenhaComValidacoes(
    usuario: Usuario,
    senhaAtual: string,
    novaSenha: string,
    confirmarNovaSenha: string
  ): Promise<void> {
    // Verificar se usuário pode alterar senha
    if (!usuario.estaAtivo()) {
      throw new UsuarioInativoError(usuario.getId());
    }

    // Verificar senha atual
    if (!(await usuario.verificarSenha(senhaAtual))) {
      throw new CredenciaisInvalidasError('Senha atual incorreta');
    }

    // Verificar confirmação da nova senha
    if (novaSenha !== confirmarNovaSenha) {
      throw new SenhaFracaError(['Confirmação de senha não confere']);
    }

    // Verificar se nova senha é diferente da atual
    if (await usuario.verificarSenha(novaSenha)) {
      throw new SenhaFracaError(['Nova senha deve ser diferente da atual']);
    }

    // Validar força da nova senha
    const validacao = this.validarForcaSenha(novaSenha);
    if (!validacao.valida) {
      throw new SenhaFracaError(validacao.requisitos);
    }

    // Realizar alteração
    await usuario.alterarSenha(senhaAtual, novaSenha);
  }

  /**
   * Processo de reset de senha com validações de token
   */
  async resetarSenhaComToken(
    usuario: Usuario,
    token: string,
    novaSenha: string,
    confirmarNovaSenha: string
  ): Promise<void> {
    // Validar token
    if (!usuario.validarTokenReset(token)) {
      throw new CredenciaisInvalidasError('Token de reset inválido ou expirado');
    }

    // Verificar confirmação
    if (novaSenha !== confirmarNovaSenha) {
      throw new SenhaFracaError(['Confirmação de senha não confere']);
    }

    // Validar força da nova senha
    const validacao = this.validarForcaSenha(novaSenha);
    if (!validacao.valida) {
      throw new SenhaFracaError(validacao.requisitos);
    }

    // Realizar reset
    await usuario.resetarSenha(novaSenha);
  }

  /**
   * Gerencia tentativas de login com lógica de bloqueio
   */
  async processarTentativaLogin(
    usuario: Usuario,
    senha: string,
    contextInfo?: { ip?: string; userAgent?: string }
  ): Promise<{ sucesso: boolean; bloqueado: boolean; motivo?: string }> {
    // Verificar se usuário pode fazer login
    if (!usuario.podeRealizarLogin()) {
      return { 
        sucesso: false, 
        bloqueado: true,
        motivo: usuario.estaSuspenso() ? 'Usuário suspenso' : 'Usuário inativo'
      };
    }

    // Verificar senha
    const senhaCorreta = await usuario.verificarSenha(senha);
    
    // Registrar tentativa
    usuario.registrarTentativaLogin(senhaCorreta, contextInfo);

    // Verificar se deve ser suspenso por muitas tentativas
    if (!senhaCorreta && usuario.getTentativasLoginFalhas() >= 5) {
      usuario.suspender('Muitas tentativas de login falharam', new Date(Date.now() + 30 * 60 * 1000)); // 30 min
      return {
        sucesso: false,
        bloqueado: true,
        motivo: 'Muitas tentativas falharam - usuário suspenso temporariamente'
      };
    }

    return {
      sucesso: senhaCorreta,
      bloqueado: usuario.estaSuspenso(),
      motivo: senhaCorreta ? undefined : 'Credenciais inválidas'
    };
  }

  /**
   * Promove um usuário para um tipo superior com validações
   */
  promoverUsuario(
    usuario: Usuario,
    novoTipo: TipoUsuario,
    rolesParaAdicionar?: Role[],
    motivo?: string
  ): void {
    if (!usuario.estaAtivo()) {
      throw new UsuarioInativoError('Não é possível promover usuário inativo');
    }

    const hierarquia = [
      TipoUsuario.CLIENTE,
      TipoUsuario.ENTREGADOR,
      TipoUsuario.LOJISTA,
      TipoUsuario.ADMIN
    ];

    const tipoAtualIndex = hierarquia.indexOf(usuario.getTipo());
    const novoTipoIndex = hierarquia.indexOf(novoTipo);

    if (novoTipoIndex <= tipoAtualIndex) {
      throw new CredenciaisInvalidasError('Não é possível rebaixar o usuário através de promoção');
    }

    // Alterar tipo
    usuario.alterarTipo(novoTipo, motivo);

    // Adicionar roles necessárias
    if (rolesParaAdicionar) {
      for (const role of rolesParaAdicionar) {
        usuario.adicionarRole(role);
      }
    }
  }

  /**
   * Transfere responsabilidades antes de desativar um usuário
   */
  async desativarComTransferencia(
    usuario: Usuario,
    usuarioSubstituto?: Usuario,
    motivo?: string
  ): Promise<void> {
    if (!usuario.estaAtivo()) {
      throw new UsuarioInativoError('Usuário já está inativo');
    }

    // Se é admin, verificar se há outro admin ativo
    if (usuario.getTipo() === TipoUsuario.ADMIN && !usuarioSubstituto) {
      const outrosAdmins = await this.usuarioRepository.findByTipoAndStatus(TipoUsuario.ADMIN, StatusUsuario.ATIVO);
      if (outrosAdmins.length <= 1) {
        throw new CredenciaisInvalidasError(
          'Não é possível desativar o último administrador sem indicar um substituto'
        );
      }
    }

    // Transferir roles críticas se necessário
    if (usuarioSubstituto && usuario.getTipo() === TipoUsuario.ADMIN) {
      const rolesAdmin = usuario.getRoles().filter(role => role.nome === 'ADMIN');
      for (const role of rolesAdmin) {
        usuarioSubstituto.adicionarRole(role);
      }
    }

    // Desativar usuário
    usuario.desativar(motivo);
  }

  /**
   * Valida se um usuário pode realizar uma ação específica
   */
  validarPermissaoAcao(
    usuario: Usuario,
    acao: string,
    contexto?: Record<string, any>
  ): boolean {
    if (!usuario.estaAtivo()) {
      return false;
    }

    // Verificar permissão básica
    if (!usuario.temPermissao(acao)) {
      return false;
    }

    // Validações específicas por contexto
    if (contexto) {
      return this.validarContextoPermissao(usuario, acao, contexto);
    }

    return true;
  }

  /**
   * Calcula score de confiabilidade do usuário
   */
  calcularScoreConfiabilidade(usuario: Usuario): number {
    let score = 50; // Score base

    // Verificações aumentam score
    if (usuario.getEmailVerificado()) score += 15;
    if (usuario.getTelefoneVerificado()) score += 10;
    if (usuario.getCpf()) score += 10;

    // Histórico de login
    if (usuario.getDataUltimoLogin()) {
      const diasSemLogin = Math.floor(
        (Date.now() - usuario.getDataUltimoLogin().getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diasSemLogin < 7) score += 10;
      else if (diasSemLogin < 30) score += 5;
    }

    // Tentativas de login diminuem score
    score -= usuario.getTentativasLoginFalhas() * 5;

    // Status afeta score
    if (usuario.getStatus() === StatusUsuario.SUSPENSO) score -= 30;
    if (usuario.getStatus() === StatusUsuario.INATIVO) score = 0;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Validação de força de senha
   */
  private validarForcaSenha(senha: string): ValidacaoSenha {
    const requisitos: string[] = [];
    let score = 0;

    if (senha.length < 8) {
      requisitos.push('Mínimo 8 caracteres');
    } else {
      score += 25;
    }

    if (!/[A-Z]/.test(senha)) {
      requisitos.push('Pelo menos uma letra maiúscula');
    } else {
      score += 25;
    }

    if (!/[a-z]/.test(senha)) {
      requisitos.push('Pelo menos uma letra minúscula');
    } else {
      score += 25;
    }

    if (!/\d/.test(senha)) {
      requisitos.push('Pelo menos um número');
    } else {
      score += 25;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
      requisitos.push('Pelo menos um caractere especial');
    } else {
      score += 25;
    }

    // Penalidades por padrões simples
    if (/123|abc|qwe/i.test(senha)) {
      score -= 20;
      requisitos.push('Não pode conter sequências simples');
    }

    if (/(.)\1{2,}/.test(senha)) {
      score -= 15;
      requisitos.push('Não pode ter caracteres repetidos consecutivos');
    }

    return {
      valida: requisitos.length === 0 && score >= 75,
      requisitos,
      score: Math.max(0, Math.min(100, score))
    };
  }

  /**
   * Validação de contexto específico para permissões
   */
  private validarContextoPermissao(
    usuario: Usuario,
    acao: string,
    contexto: Record<string, any>
  ): boolean {
    // Implementar validações específicas baseadas no contexto
    // Por exemplo: um lojista só pode editar seus próprios produtos
    if (acao === 'produto.atualizar' && usuario.getTipo() === TipoUsuario.LOJISTA) {
      return contexto.lojistaId === usuario.getId();
    }

    // Clientes só podem ver seus próprios pedidos
    if (acao === 'pedido.visualizar' && usuario.getTipo() === TipoUsuario.CLIENTE) {
      return contexto.clienteId === usuario.getId();
    }

    return true;
  }
}
