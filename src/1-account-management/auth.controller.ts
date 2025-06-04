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

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuário logado' })
  @ApiResponse({ status: 200, description: 'Perfil do usuário' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async getUserProfile(@Req() req: any) {
    return this.authService.getUserProfile(req.user.id);
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

  // Novo: login Google para lojista
  @Post('lojista/google')
  @Public()
  @ApiOperation({ summary: 'Login de lojista via Google' })
  async lojistaGoogleLogin(@Body('token') token: string) {
    // Lógica para autenticar lojista via Google
    return this.authService.loginParceiroGoogle(token, 'lojista');
  }

  // Novo: login Google para entregador
  @Post('entregador/google')
  @Public()
  @ApiOperation({ summary: 'Login de entregador via Google' })
  async entregadorGoogleLogin(@Body('token') token: string) {
    // Lógica para autenticar entregador via Google
    return this.authService.loginParceiroGoogle(token, 'entregador');
  }
}