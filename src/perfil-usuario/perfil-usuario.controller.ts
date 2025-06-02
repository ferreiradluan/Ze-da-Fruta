import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { PerfilUsuarioService } from './perfil-usuario.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PerfilUsuario } from '../common/entities/perfil-usuario.entity';
import { UsersService } from '../users/users.service';

@Controller('perfil-usuario')
export class PerfilUsuarioController {
  constructor(
    private readonly perfilUsuarioService: PerfilUsuarioService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async solicitarPerfil(@Req() req: Request, @Body('perfil') perfil: PerfilUsuario) {
    // O usuário autenticado solicita um novo perfil
    if (!req.user) {
      throw new Error('Usuário não autenticado');
    }
    // Busca o usuário no banco pelo id do JWT
    const userId = (req.user as any).id;
    const usuario = await this.usersService.findById(userId);
    return this.perfilUsuarioService.criarPerfil(usuario, perfil);
  }
}
