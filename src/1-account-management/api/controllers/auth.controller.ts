import { Controller, Get, Req, Res, UseGuards, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { GoogleAuthGuard } from '../../application/strategies/google-auth.guard';
import { AuthService } from '../../application/services/auth.service';
import { LoginAdminDto } from '../dto/login-admin.dto';

@ApiTags('🔐 Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Login com Google (Cliente/Entregador/Vendedor)',
    description: 'Inicia o processo de autenticação com Google OAuth. Redireciona para a página de login do Google.'
  })
  @ApiResponse({
    status: 302,
    description: 'Redireciona para o Google OAuth'
  })
  async googleAuth() {
    // O Passport redireciona para o Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Callback do Google OAuth',
    description: 'Endpoint chamado pelo Google após autenticação. Redireciona para o frontend com o token JWT.'
  })
  @ApiResponse({
    status: 302,
    description: 'Redireciona para o frontend com o token JWT como parâmetro na URL.'
  })
  async googleAuthRedirect(@Req() req, @Res() res) {
    const token = req.user?.token;
    if (token) {
      return res.redirect(`https://ze-da-futa-frony.vercel.app/auth/google/callback?token=${token}`);
    }
    return res.redirect('https://ze-da-futa-frony.vercel.app/auth/google/callback?error=auth_failed');
  }

  @Post('admin/login')
  @ApiOperation({
    summary: 'Login de Administrador',
    description: 'Autentica um administrador usando email e senha. Retorna token JWT para acesso aos endpoints administrativos.'
  })
  @ApiBody({ type: LoginAdminDto })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'Token JWT para autenticação'
        },
        admin: {
          type: 'object',
          properties: {            id: { type: 'string', example: 'uuid-do-admin' },
            nome: { type: 'string', example: 'Administrador' },
            email: { type: 'string', example: 'zedafruta@admin.com' },
            roles: { 
              type: 'array', 
              items: { type: 'string' }, 
              example: ['ADMIN'] 
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Email ou senha incorretos' },
        error: { type: 'string', example: 'Unauthorized' }
      }
    }
  })  async adminLogin(@Body() loginAdminDto: LoginAdminDto) {
    return this.authService.loginAdmin(loginAdminDto);
  }
}
