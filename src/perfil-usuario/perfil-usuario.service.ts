import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerfilUsuarioEntity, PerfilUsuario, StatusAprovacaoPerfil } from '../common/entities/perfil-usuario.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class PerfilUsuarioService {
  constructor(
    @InjectRepository(PerfilUsuarioEntity)
    private readonly perfilRepository: Repository<PerfilUsuarioEntity>,
    private readonly usersService: UsersService,
  ) {}

  async criarPerfil(usuario: User, perfil: PerfilUsuario) {
    // Atualiza o role do usuário conforme o perfil solicitado
    if (perfil === PerfilUsuario.VENDEDOR && usuario.role !== UserRole.SELLER) {
      usuario.role = UserRole.SELLER;
      await this.usersService.update(usuario.userId, { role: UserRole.SELLER });
    }
    if (perfil === PerfilUsuario.ENTREGADOR && usuario.role !== UserRole.DELIVERY_PERSON) {
      usuario.role = UserRole.DELIVERY_PERSON;
      await this.usersService.update(usuario.userId, { role: UserRole.DELIVERY_PERSON });
    }
    const novoPerfil = this.perfilRepository.create({
      usuario,
      perfil,
      status_aprovacao: perfil === PerfilUsuario.CLIENTE ? StatusAprovacaoPerfil.APROVADO : StatusAprovacaoPerfil.PENDENTE,
    });
    return this.perfilRepository.save(novoPerfil);
  }

  async listarPerfisDoUsuario(usuario: User) {
    return this.perfilRepository.find({ where: { usuario } });
  }

  async aprovarPerfil(id: number) {
    await this.perfilRepository.update(id, { status_aprovacao: StatusAprovacaoPerfil.APROVADO });
  }

  async alternarPerfilAtivo(usuario: User, perfil: PerfilUsuario) {
    // Aqui você pode implementar lógica para alternar o perfil ativo na sessão/JWT
  }
}
