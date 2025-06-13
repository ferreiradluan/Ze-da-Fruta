import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { UsuarioRepository } from '../../infrastructure/repositories/usuario.repository';
import { Usuario } from '../../domain/entities/usuario.entity';
import { UpdateUserDto } from '../../api/dto/update-user.dto';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);
  
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
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
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        status: usuario.status,
        roles: roles.map(r => r?.nome ?? null).filter(Boolean),
        perfil: perfil,
        enderecos,
      };
    } catch (err) {
      this.logger.error('Erro ao buscar perfil do usuário', err);
      throw new InternalServerErrorException('Erro ao buscar perfil do usuário: ' + (err?.message || err));
    }
  }
  async updateMyProfile(userId: string, body: UpdateUserDto) {
    try {
      const usuario = await this.usuarioRepository.findOne({ where: { id: userId } });
      if (!usuario) {
        throw new NotFoundException('Usuário não encontrado');
      }
      if (body.email && body.email !== usuario.email) {
        const emailExists = await this.usuarioRepository.findOne({ where: { email: body.email } });
        if (emailExists) {
          throw new BadRequestException('E-mail já está em uso');
        }
        usuario.email = body.email;
      }
      if (body.nome) {
        usuario.nome = body.nome;
      }
      await this.usuarioRepository.save(usuario);
      return {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        status: usuario.status,
        atualizadoEm: new Date(),
      };
    } catch (err) {
      this.logger.error('Erro ao atualizar perfil do usuário', err);
      throw new InternalServerErrorException('Erro ao atualizar perfil do usuário: ' + (err?.message || err));
    }
  }

  // ===== MÉTODOS PARA GERENCIAMENTO DE IMAGENS =====

  async updateUserProfilePhoto(userId: string, photoUrl: string): Promise<void> {
    try {
      const usuario = await this.usuarioRepository.findOne({ where: { id: userId } });
      if (!usuario) {
        throw new NotFoundException('Usuário não encontrado');
      }
      
      // usuario.fotoPerfil = photoUrl; // Campo removido conforme diagrama
      await this.usuarioRepository.save(usuario);
      
      this.logger.log(`Foto de perfil atualizada para usuário ${userId}: ${photoUrl}`);
    } catch (err) {
      this.logger.error('Erro ao atualizar foto de perfil do usuário', err);
      throw new InternalServerErrorException('Erro ao atualizar foto de perfil: ' + (err?.message || err));
    }
  }  async deleteUserProfilePhoto(userId: string): Promise<string | null> {
    try {
      const usuario = await this.usuarioRepository.findOne({ where: { id: userId } });
      if (!usuario) {
        throw new NotFoundException('Usuário não encontrado');
      }
      
      // const currentPhotoUrl = usuario.fotoPerfil; // Campo removido conforme diagrama
      // usuario.fotoPerfil = null; // Campo removido conforme diagrama
      await this.usuarioRepository.save(usuario);
      
      this.logger.log(`Foto de perfil removida para usuário ${userId}`);
      return currentPhotoUrl;
    } catch (err) {
      this.logger.error('Erro ao remover foto de perfil do usuário', err);
      throw new InternalServerErrorException('Erro ao remover foto de perfil: ' + (err?.message || err));
    }
  }

  // Método removido - AccountService deve gerenciar apenas Usuários conforme diagrama
  async updateAdminProfilePhoto(adminId: string, photoUrl: string): Promise<void> {
    throw new Error('Método não implementado - AccountService deve gerenciar apenas Usuários');
  }
      throw new InternalServerErrorException('Erro ao atualizar foto de perfil: ' + (err?.message || err));
    }
  }
  async deleteAdminProfilePhoto(adminId: string): Promise<string | null> {
    try {
      const admin = await this.adminRepository.findOne({ where: { id: adminId } });
      if (!admin) {
        throw new NotFoundException('Admin não encontrado');
      }
      
      const currentPhotoUrl = admin.fotoPerfil;
      admin.fotoPerfil = null;
      await this.adminRepository.save(admin);
      
      this.logger.log(`Foto de perfil removida para admin ${adminId}`);
      return currentPhotoUrl;
    } catch (err) {
      this.logger.error('Erro ao remover foto de perfil do admin', err);
      throw new InternalServerErrorException('Erro ao remover foto de perfil: ' + (err?.message || err));
    }
  }

  // ===== MÉTODOS PARA APROVAÇÃO DE PARCEIROS =====

  /**
   * Cria usuário parceiro a partir de solicitação aprovada
   */
  async criarUsuarioParceiro(solicitacao: SolicitacaoParceiro): Promise<string> {
    try {
      this.logger.log(`Criando usuário parceiro para solicitação ${solicitacao.id}`);

      // Verificar se já existe usuário com este email
      const usuarioExistente = await this.usuarioRepository.findOne({
        where: { email: solicitacao.email }
      });

      if (usuarioExistente) {
        this.logger.log(`Usuário com email ${solicitacao.email} já existe, retornando ID existente`);
        return usuarioExistente.id;
      }

      // Criar novo usuário
      const novoUsuario = this.usuarioRepository.create({
        nome: solicitacao.nome,
        email: solicitacao.email,
        status: 'ATIVO' as any
      });

      const usuarioSalvo = await this.usuarioRepository.save(novoUsuario);

      this.logger.log(`Usuário parceiro criado com sucesso: ${usuarioSalvo.id}`);
      return usuarioSalvo.id;

    } catch (err) {
      this.logger.error(`Erro ao criar usuário parceiro para solicitação ${solicitacao.id}`, err);
      throw new InternalServerErrorException('Erro ao criar usuário parceiro: ' + (err?.message || err));
    }
  }
  /**
   * Lista todos os usuários da plataforma para o admin
   */
  async listarTodosUsuarios(): Promise<any[]> {
    try {
      const usuarios = await this.usuarioRepository.find({
        relations: ['roles', 'perfis'],
        order: { createdAt: 'DESC' }
      });

      return usuarios.map(usuario => ({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        status: usuario.status,
        roles: Array.isArray(usuario.roles) ? usuario.roles.map(r => r?.nome).filter(Boolean) : [],
        criadoEm: usuario.createdAt,
        ultimoLogin: null, // TODO: Implementar campo ultimoLogin
        // TODO: Implementar contagem de pedidos e avaliação média
        totalPedidos: 0,
        avaliacaoMedia: null
      }));
    } catch (err) {
      this.logger.error('Erro ao listar usuários', err);
      throw new InternalServerErrorException('Erro ao listar usuários: ' + (err?.message || err));
    }
  }

  /**
   * Busca usuários por termo de pesquisa
   */
  async buscarUsuariosPorTermo(search: string): Promise<any[]> {
    try {
      const usuarios = await this.usuarioRepository
        .createQueryBuilder('usuario')
        .leftJoinAndSelect('usuario.roles', 'roles')
        .leftJoinAndSelect('usuario.perfis', 'perfis')
        .where('usuario.nome ILIKE :search OR usuario.email ILIKE :search', { search: `%${search}%` })
        .orderBy('usuario.createdAt', 'DESC')
        .getMany();

      return usuarios.map(usuario => ({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        status: usuario.status,
        roles: Array.isArray(usuario.roles) ? usuario.roles.map(r => r?.nome).filter(Boolean) : [],
        criadoEm: usuario.createdAt,
        ultimoLogin: null, // TODO: Implementar campo ultimoLogin
        totalPedidos: 0,
        avaliacaoMedia: null
      }));
    } catch (err) {
      this.logger.error('Erro ao buscar usuários por termo', err);
      throw new InternalServerErrorException('Erro ao buscar usuários: ' + (err?.message || err));
    }
  }

  /**
   * Busca usuário por ID
   */
  async buscarUsuarioPorId(usuarioId: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: usuarioId },
      relations: ['roles', 'perfis']
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return usuario;
  }

  /**
   * Atualiza dados do usuário
   */
  async atualizarUsuario(usuario: Usuario): Promise<Usuario> {
    try {
      return await this.usuarioRepository.save(usuario);
    } catch (err) {
      this.logger.error('Erro ao atualizar usuário', err);
      throw new InternalServerErrorException('Erro ao atualizar usuário: ' + (err?.message || err));
    }
  }

  /**
   * Conta novos usuários no mês atual
   */
  async contarNovosUsuariosMesAtual(): Promise<number> {
    try {
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const count = await this.usuarioRepository
        .createQueryBuilder('usuario')
        .where('usuario.createdAt >= :inicioMes', { inicioMes })
        .getCount();

      return count;
    } catch (err) {
      this.logger.error('Erro ao contar novos usuários', err);
      return 0;
    }
  }
}
