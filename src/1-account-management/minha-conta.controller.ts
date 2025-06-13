import { Controller, Delete, Req, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('auth')
export class MinhaContaController {
  constructor(private readonly usersService: UsersService) {}
  @Delete('minha-conta')
  async deletarConta(@Req() req: Request) {
    // Remove a conta do usuário autenticado
    await this.usersService.remove((req.user as any).id);
    return { message: 'Conta removida com sucesso.' };
  }
}

