import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Usuario } from '../../domain/entities/usuario.entity';
import { Admin } from '../../domain/entities/admin.entity';
import { Endereco } from '../../domain/entities/endereco.entity';
import { UsuarioRepository } from '../../infrastructure/repositories/usuario.repository';
import { EnderecoRepository } from '../../infrastructure/repositories/endereco.repository';
import { UpdateUserDto } from '../../api/dto/update-user.dto';
import { STATUS_USUARIO } from '../../domain/types/status-usuario.types';

/**
 * 🔧 FASE 3: ACCOUNTSERVICE REFATORADO PARA ORQUESTRAÇÃO PURA
 * 
 * ✅ APENAS persistência e consultas
 * ✅ Lógica de negócio está na entidade Usuario
 * ✅ Usa métodos da entidade para mudanças de estado
 */
/**
 * AccountService - Camada de Lógica de Negócio
 * Implementa casos de uso relacionados à gestão de contas
 */
@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly enderecoRepository: EnderecoRepository,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async getMyProfile(userId: string) {
    try {
      // Busca o usuário e carrega as relações, mas trata null/undefined explicitamente
      const usuario = await this.usuarioRepository.findOne({
        where: { id: userId },
        relations: ['roles', 'perfil', 'enderecos'],
      });
      
      if (!usuario) {
        throw new NotFoundException('Usuário não encontrado');
      }
      
      // Defensive: garante arrays mesmo se TypeORM retornar null
      const roles = Array.isArray(usuario.roles) ? usuario.roles : (usuario.roles ? [usuario.roles] : []);
      const perfil = usuario.perfil;
      const enderecos = Array.isArray(usuario.enderecos) ? usuario.enderecos : (usuario.enderecos ? [usuario.enderecos] : []);
      
      return {
        id: usuario.id,        nome: usuario.nome,
        email: usuario.email,
        status: usuario.status,
        roles: roles.map(r => r?.nome ?? null).filter(Boolean),
        perfil: perfil?.statusPerfil ?? null,
        enderecos,
      };    } catch (err: any) {
      this.logger.error('Erro ao buscar perfil do usuário', err);
      throw new InternalServerErrorException('Erro ao buscar perfil do usuário: ' + (err?.message || String(err)));
    }
  }

  async updateMyProfile(userId: string, body: UpdateUserDto) {
    try {
      const usuario = await this.usuarioRepository.findOne({
        where: { id: userId }
      });
      
      if (!usuario) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Atualizar apenas os campos fornecidos
      if (body.nome) usuario.nome = body.nome;
      if (body.email) usuario.email = body.email;

      const usuarioAtualizado = await this.usuarioRepository.save(usuario);
      
      return {
        id: usuarioAtualizado.id,
        nome: usuarioAtualizado.nome,
        email: usuarioAtualizado.email,
        status: usuarioAtualizado.status,
      };    } catch (err: any) {
      this.logger.error('Erro ao atualizar perfil do usuário', err);
      
      if (err instanceof NotFoundException) {
        throw err;
      }
      
      throw new InternalServerErrorException('Erro ao atualizar perfil do usuário: ' + (err?.message || String(err)));
    }
  }

  // ===== MÉTODOS PARA GERENCIAMENTO DE IMAGENS =====

  async updateUserProfilePhoto(userId: string, photoUrl: string): Promise<void> {
    try {
      const usuario = await this.usuarioRepository.findOne({
        where: { id: userId },
        relations: ['perfil']
      });

      if (!usuario) {
        throw new NotFoundException('Usuário não encontrado');
      }

      if (!usuario.perfil) {
        throw new NotFoundException('Perfil do usuário não encontrado');
      }

      usuario.perfil.fotoPerfil = photoUrl;
      await this.usuarioRepository.save(usuario);    } catch (err: any) {
      this.logger.error(`Erro ao atualizar foto do perfil do usuário ${userId}`, err);
      throw new InternalServerErrorException('Erro ao atualizar foto do perfil: ' + (err?.message || String(err)));
    }
  }

  async deleteUserProfilePhoto(userId: string): Promise<string | null> {
    try {
      const usuario = await this.usuarioRepository.findOne({
        where: { id: userId },
        relations: ['perfil']
      });

      if (!usuario) {
        throw new NotFoundException('Usuário não encontrado');
      }

      if (!usuario.perfil || !usuario.perfil.fotoPerfil) {
        return null; // Não tinha foto para deletar
      }

      const fotoAnterior = usuario.perfil.fotoPerfil;
      usuario.perfil.fotoPerfil = undefined;
      await this.usuarioRepository.save(usuario);

      return fotoAnterior;

    } catch (err) {
      this.logger.error(`Erro ao deletar foto do perfil do usuário ${userId}`, err);
      throw new InternalServerErrorException('Erro ao deletar foto do perfil: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  // ===== MÉTODOS DE INTEGRAÇÃO COM OUTROS MÓDULOS =====

  /**
   * Cria um usuário a partir de uma solicitação de parceiro aprovada
   */
  async criarUsuarioParceiro(solicitacao: any): Promise<string> {
    try {
      this.logger.log(`Criando usuário parceiro para solicitação ${solicitacao.id}`);

      // Verificar se usuário já existe
      const usuarioExistente = await this.usuarioRepository.findOne({
        where: { email: solicitacao.email }
      });      if (usuarioExistente) {
        this.logger.log(`Usuário com email ${solicitacao.email} já existe, retornando ID existente`);
        return usuarioExistente.id!;
      }      // Criar novo usuário como PENDENTE (não ATIVO)
      const novoUsuario = await this.usuarioRepository.create({
        nome: solicitacao.dados.nome,
        email: solicitacao.email,
        status: STATUS_USUARIO.PENDENTE // ✅ Parceiros aprovados começam como PENDENTE
      });

      const usuarioSalvo = await this.usuarioRepository.save(novoUsuario);
      this.logger.log(`Usuário parceiro criado com sucesso: ${usuarioSalvo.id}`);
      return usuarioSalvo.id!;

    } catch (err) {
      this.logger.error(`Erro ao criar usuário parceiro para solicitação ${solicitacao.id}`, err);
      throw new InternalServerErrorException('Erro ao criar usuário parceiro: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  // ===== MÉTODOS ADMINISTRATIVOS =====

  /**
   * Lista todos os usuários da plataforma para o admin
   */
  async listarTodosUsuarios(): Promise<any[]> {
    try {
      const usuarios = await this.usuarioRepository.find({
        relations: ['roles', 'perfil'],
        order: { createdAt: 'DESC' }
      });

      return usuarios.map(usuario => ({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        status: usuario.status,
        createdAt: usuario.createdAt,
        roles: usuario.roles?.map(r => r.nome) || [],
        perfil: usuario.perfil?.statusPerfil || null
      }));

    } catch (err) {
      this.logger.error('Erro ao listar usuários', err);
      throw new InternalServerErrorException('Erro ao listar usuários: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  /**
   * Lista apenas usuários pendentes de aprovação
   */
  async listarUsuariosPendentes(): Promise<any[]> {
    try {
      const usuarios = await this.usuarioRepository.find({
        where: { status: STATUS_USUARIO.PENDENTE },
        relations: ['roles', 'perfil'],
        order: { createdAt: 'DESC' }
      });

      return usuarios.map(usuario => ({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        status: usuario.status,
        createdAt: usuario.createdAt,
        roles: usuario.roles?.map(r => r.nome) || [],
        perfil: usuario.perfil?.statusPerfil || null
      }));

    } catch (err) {
      this.logger.error('Erro ao listar usuários pendentes', err);
      throw new InternalServerErrorException('Erro ao listar usuários pendentes: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  /**
   * Busca um usuário por ID (usado pelo admin)
   */
  async buscarUsuarioPorId(usuarioId: string): Promise<Usuario> {
    try {
      const usuario = await this.usuarioRepository.findOne({
        where: { id: usuarioId },
        relations: ['roles', 'perfil', 'enderecos']
      });

      if (!usuario) {
        throw new NotFoundException('Usuário não encontrado');
      }

      return usuario;
    } catch (err) {
      this.logger.error(`Erro ao buscar usuário ${usuarioId}`, err);
      
      if (err instanceof NotFoundException) {
        throw err;
      }
      
      throw new InternalServerErrorException('Erro ao buscar usuário: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  /**
   * Atualiza um usuário (usado pelo admin)
   */
  async atualizarUsuario(usuarioId: string, dados: any): Promise<Usuario> {
    try {
      const usuario = await this.buscarUsuarioPorId(usuarioId);

      // Atualizar campos permitidos
      if (dados.nome) usuario.nome = dados.nome;
      if (dados.email) usuario.email = dados.email;
      if (dados.status) usuario.status = dados.status;

      return await this.usuarioRepository.save(usuario);

    } catch (err) {
      this.logger.error(`Erro ao atualizar usuário ${usuarioId}`, err);
      
      if (err instanceof NotFoundException) {
        throw err;
      }
      
      throw new InternalServerErrorException('Erro ao atualizar usuário: ' + (err instanceof Error ? err.message : String(err)));
    }
  }
  /**
   * Conta novos usuários do mês atual
   */
  async contarNovosUsuariosMesAtual(): Promise<number> {
    try {
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const usuarios = await this.usuarioRepository
        .find({
          where: {
            created_at: MoreThanOrEqual(inicioMes)
          }
        });

      return usuarios.length;
    } catch (err) {
      this.logger.error('Erro ao contar novos usuários', err);
      return 0;
    }
  }

  /**
   * Adiciona um endereço para o usuário
   */
  async adicionarEndereco(userId: string, dadosEndereco: any): Promise<Endereco> {
    try {
      const usuario = await this.usuarioRepository.findOne({
        where: { id: userId }
      });

      if (!usuario) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Se é o primeiro endereço, deve ser principal
      const enderecoExistente = await this.enderecoRepository.findByUsuarioId(userId);
      const ehPrimeiro = enderecoExistente.length === 0;

      const novoEndereco = await this.enderecoRepository.create({
        ...dadosEndereco,
        usuarioId: userId,
        principal: ehPrimeiro,
        ativo: true
      });

      return await this.enderecoRepository.save(novoEndereco);

    } catch (err) {
      this.logger.error('Erro ao adicionar endereço', err);
      throw new InternalServerErrorException('Erro ao adicionar endereço: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  /**
   * Remove um endereço do usuário
   */
  async removerEndereco(userId: string, enderecoId: string): Promise<void> {
    try {
      await this.enderecoRepository.remove(userId, enderecoId);
    } catch (err) {
      this.logger.error('Erro ao remover endereço', err);
      throw new InternalServerErrorException('Erro ao remover endereço: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  /**
   * Define um endereço como principal
   */
  async definirEnderecoPrincipal(userId: string, enderecoId: string): Promise<void> {
    try {
      await this.enderecoRepository.definirComoPrincipal(userId, enderecoId);
    } catch (err) {
      this.logger.error('Erro ao definir endereço principal', err);
      throw new InternalServerErrorException('Erro ao definir endereço principal: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  /**
   * Obtém todos os endereços do usuário
   */
  async obterEnderecos(userId: string): Promise<any[]> {
    try {
      return this.enderecoRepository.findByUsuarioId(userId);
    } catch (err) {
      this.logger.error('Erro ao obter endereços', err);
      throw new InternalServerErrorException('Erro ao obter endereços: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  /**
   * Aprova solicitação de parceiro (chamado pelo AdminService)
   */
  async aprovarSolicitacaoParceiro(solicitacaoId: string): Promise<any> {
    this.logger.log(`Aprovando solicitação de parceiro: ${solicitacaoId}`);
    
    try {
      // Buscar usuário pela solicitação (assumindo que solicitacaoId é o userId por enquanto)
      const usuario = await this.usuarioRepository.findOne({
        where: { id: solicitacaoId },
        relations: ['perfil', 'roles']
      });

      if (!usuario) {
        throw new NotFoundException('Usuário/Solicitação não encontrado');
      }      // ✅ APROVAR O USUÁRIO (PENDENTE -> ATIVO)
      if (usuario.isPendente()) {
        usuario.aprovar();
      }

      // Atualizar status do perfil para aprovado
      if (usuario.perfil) {
        usuario.perfil.statusPerfil = 'APROVADO';
      }
      
      await this.usuarioRepository.save(usuario);

      this.logger.log(`Solicitação de parceiro aprovada: ${solicitacaoId}`);
      
      return {
        solicitacaoId,
        usuarioId: usuario.id,
        status: 'APROVADO',
        statusUsuario: usuario.status,
        message: 'Solicitação de parceiro aprovada com sucesso'
      };} catch (error) {
      this.logger.error('Erro ao aprovar solicitação de parceiro', error);
      throw new InternalServerErrorException('Erro ao aprovar solicitação: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  /**
   * Atualiza status de usuário (chamado pelo AdminService)
   */
  async atualizarStatusUsuario(usuarioId: string, novoStatus: string): Promise<any> {
    this.logger.log(`Atualizando status do usuário ${usuarioId} para: ${novoStatus}`);
    
    try {
      const usuario = await this.usuarioRepository.findOne({
        where: { id: usuarioId }
      });

      if (!usuario) {
        throw new NotFoundException('Usuário não encontrado');
      }      // Validar status permitidos (incluindo PENDENTE)
      const statusPermitidos = ['ATIVO', 'INATIVO', 'SUSPENSO', 'BANIDO', 'PENDENTE'];
      if (!statusPermitidos.includes(novoStatus.toUpperCase())) {
        throw new BadRequestException('Status inválido. Permitidos: ' + statusPermitidos.join(', '));
      }

      // ✅ Usar métodos da entidade para lógica de negócio
      switch (novoStatus.toUpperCase()) {        case 'ATIVO':
          if (usuario.isPendente()) {
            usuario.aprovar(); // Usar método específico para aprovar usuários pendentes
          } else {
            usuario.ativar();
          }
          break;
        case 'INATIVO':
          usuario.desativar();
          break;
        case 'SUSPENSO':
          usuario.suspender();
          break;
        default:          // Para outros status como BANIDO que não tem método específico
          (usuario as any).status = novoStatus.toUpperCase();
      }

      await this.usuarioRepository.save(usuario);

      this.logger.log(`Status do usuário ${usuarioId} atualizado para: ${novoStatus}`);
      
      return {
        usuarioId,
        novoStatus: usuario.status,
        message: 'Status do usuário atualizado com sucesso'
      };    } catch (error) {
      this.logger.error('Erro ao atualizar status do usuário', error);
      throw new InternalServerErrorException('Erro ao atualizar status: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * Obtém um usuário específico por ID
   */
  async obterUsuarioPorId(usuarioId: string): Promise<any> {
    try {
      const usuario = await this.usuarioRepository.findOne({
        where: { id: usuarioId },
        relations: ['roles', 'perfil']
      });

      if (!usuario) {
        throw new NotFoundException('Usuário não encontrado');
      }

      return {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        status: usuario.status,
        createdAt: usuario.createdAt,
        updatedAt: usuario.updatedAt,
        googleId: usuario.googleId,
        roles: usuario.roles?.map(r => r.nome) || [],
        perfil: usuario.perfil ? {
          telefone: usuario.perfil.telefone,
          documento: usuario.perfil.documento,
          tipoDocumento: usuario.perfil.tipoDocumento,
          statusPerfil: usuario.perfil.statusPerfil,
          emailVerificado: usuario.perfil.emailVerificado,
          telefoneVerificado: usuario.perfil.telefoneVerificado,
          documentoVerificado: usuario.perfil.documentoVerificado
        } : null
      };

    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      this.logger.error('Erro ao obter usuário por ID', err);
      throw new InternalServerErrorException('Erro ao obter usuário: ' + (err instanceof Error ? err.message : String(err)));
    }
  }
}
