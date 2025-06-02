import { Controller, Get, UseGuards, Req, Res, Query, Put, Param, Body, ParseIntPipe, Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Role } from './role.enum';
import { Roles } from './roles.decorator';
import { UserRole, UserProfileType } from '../users/entities/user.entity';
import { Public } from './decorators/public.decorator';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Iniciar autenticação com Google' })
  async googleAuth() {
    // O guard redirecionará para a página de login do Google
  }

  @Get('google/callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Callback da autenticação com Google' })
  @ApiResponse({ status: 200, description: 'Usuário autenticado com sucesso' })
  async googleAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = await this.authService.validateGoogleUser(req.user);
    const result = await this.authService.login(user);
    // Adiciona o token à sessão em memória
    const { MemorySessionGuard } = await import('./guards/memory-session.guard');
    MemorySessionGuard.addToken(result.access_token);
    return res.status(200).json({ access_token: result.access_token });
  }

  @Get('success')
  @ApiOperation({ summary: 'Página de sucesso após autenticação' })
  @ApiResponse({ status: 200, description: 'Login bem-sucedido' })
  authSuccess(@Query('token') token: string, @Res() res: Response) {
    // Agora não é mais necessário, mas pode ser removido se não for usado em outro lugar
    res.status(200).json({ message: 'Login com Google realizado com sucesso.' });
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuário logado' })
  @ApiResponse({ status: 200, description: 'Perfil do usuário' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async getUserProfile(@Req() req: any) {
    return this.authService.getUserProfile(req.user.id);
  }

  @Put('profile/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar tipo de perfil do usuário' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body('profileType') profileType: UserProfileType,
  ) {
    return this.authService.updateUserProfile(id, profileType);
  }

  @Put('role/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar role do usuário (apenas admin)' })
  @ApiResponse({ status: 200, description: 'Role atualizada com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body('role') role: UserRole,
  ) {
    return this.authService.updateUserRole(id, role);
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login com email e senha' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() loginDto: { email: string; senha: string }) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.senha);
    const result = await this.authService.login(user);
    // Adiciona o token à sessão em memória para funcionar com MemorySessionGuard
    const { MemorySessionGuard } = await import('./guards/memory-session.guard');
    MemorySessionGuard.addToken(result.access_token);
    return result;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout do usuário' })
  @ApiBearerAuth()
  async logout(@Req() req: Request) {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { MemorySessionGuard } = await import('./guards/memory-session.guard');
      MemorySessionGuard.removeToken(token);
    }
    return { message: 'Logout realizado com sucesso.' };
  }
}