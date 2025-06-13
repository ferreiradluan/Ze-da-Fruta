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
      const usuario = await this.usuarioRepository.findOne({
        where: { id: userId },
        relations: ['roles', 'perfil', 'enderecos'],
      });
      if (!usuario) {
        throw new NotFoundException('Usuário não encontrado');
      }
      
      const roles = Array.isArray(usuario.roles) ? usuario.roles : (usuario.roles ? [usuario.roles] : []);
      const perfil = usuario.perfil;
      
      return {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        status: usuario.status,
        roles: roles.map(r => r?.nome ?? null).filter(Boolean),
        perfil: perfil,
        enderecos: usuario.enderecos || [],
      };
    } catch (err) {
      this.logger.error('Erro ao buscar perfil do usuário', err);
      throw new InternalServerErrorException('Erro ao buscar perfil do usuário: ' + (err?.message || err));
    }
  }

  async updateUser(userId: string, updateData: UpdateUserDto): Promise<Usuario> {
    try {
      const usuario = await this.usuarioRepository.findOne({ where: { id: userId } });
      if (!usuario) {
        throw new NotFoundException('Usuário não encontrado');
      }

      if (updateData.nome) usuario.nome = updateData.nome;
      
      return await this.usuarioRepository.save(usuario);
    } catch (err) {
      this.logger.error('Erro ao atualizar usuário', err);
      throw new InternalServerErrorException('Erro ao atualizar usuário: ' + (err?.message || err));
    }
  }
}
