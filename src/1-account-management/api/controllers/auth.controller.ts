import { Controller, Get, Req, Res, UseGuards, Post, Body, HttpCode, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { GoogleAuthGuard } from '../../application/strategies/google-auth.guard';
import { AuthService } from '../../application/services/auth.service';
import { LoginAdminDto } from '../dto/login-admin.dto';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('🔐 Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Get('user')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Login de Usuário com Google',
    description: 'Inicia autenticação Google para usuários normais. Usuários são automaticamente aprovados e ativos.'
  })
  @ApiResponse({
    status: 302,
    description: 'Redireciona para o Google OAuth'
  })
  async googleAuthUser(@Req() req) {
    try {
      console.log('=== INICIANDO LOGIN GOOGLE USER ===');
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Request URL:', req.url);
      console.log('Request headers:', req.headers);
      
      // Verificar configurações OAuth
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
      
      if (!googleClientId) {
        console.error('❌ GOOGLE_CLIENT_ID não configurado');
        throw new Error('Configuração OAuth incompleta');
      }
      
      if (!callbackUrl) {
        console.error('❌ GOOGLE_CALLBACK_URL não configurado');
        throw new Error('URL de callback não configurada');
      }
      
      console.log('✅ Configurações OAuth verificadas');
      console.log('Client ID:', googleClientId.substring(0, 10) + '...');
      console.log('Callback URL:', callbackUrl);
      
      // Armazenar tipo de usuário na sessão
      req.session = req.session || {};
      req.session.userType = 'user';
      
      console.log('✅ Sessão configurada, redirecionando para Google...');
      
      // O Passport redireciona para o Google
    } catch (error) {
      console.error('❌ Erro no endpoint /auth/user:', error);
      throw error;
    }
  }
  @Get('user/google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Login com Google (Cliente/Usuário) - Compatibilidade',
    description: 'Endpoint de compatibilidade. Use /auth/user para nova implementação.'
  })
  @ApiResponse({
    status: 302,
    description: 'Redireciona para o Google OAuth'
  })
  async googleAuthUserLegacy(@Req() req) {
    try {
      console.log('=== INICIANDO LOGIN GOOGLE USER/GOOGLE ===');
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Request URL:', req.url);
      
      // Verificar configurações OAuth
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
      
      if (!googleClientId || !callbackUrl) {
        console.error('❌ Configuração OAuth incompleta');
        throw new Error('Configuração OAuth incompleta');
      }
      
      console.log('✅ Configurações OAuth verificadas para /auth/user/google');
      console.log('Client ID:', googleClientId.substring(0, 10) + '...');
      console.log('Callback URL:', callbackUrl);
      
      // Armazenar tipo de usuário na sessão
      req.session = req.session || {};
      req.session.userType = 'user';
      console.log('✅ Sessão configurada, redirecionando para Google...');
      
      // O Passport redireciona para o Google
    } catch (error) {
      console.error('❌ Erro no endpoint /auth/user/google:', error);
      throw error;
    }
  }

  @Get('vendedor')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Login de Vendedor com Google',
    description: 'Inicia autenticação Google para vendedores/lojistas. Requer aprovação posterior.'
  })
  @ApiResponse({
    status: 302,
    description: 'Redireciona para o Google OAuth'
  })  async googleAuthVendedor(@Req() req) {
    // Armazenar tipo de usuário na sessão
    req.session = req.session || {};
    req.session.userType = 'vendedor';
    // O Passport redireciona para o Google
  }
  @Get('vendedor/google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Login com Google (Vendedor/Lojista) - Compatibilidade',
    description: 'Endpoint de compatibilidade. Use /auth/vendedor para nova implementação.'
  })
  @ApiResponse({
    status: 302,
    description: 'Redireciona para o Google OAuth'
  })
  async googleAuthVendedorLegacy(@Req() req) {
    try {
      console.log('=== INICIANDO LOGIN GOOGLE VENDEDOR/GOOGLE ===');
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Request URL:', req.url);
      
      // Verificar configurações OAuth
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
      
      if (!googleClientId || !callbackUrl) {
        console.error('❌ Configuração OAuth incompleta');
        throw new Error('Configuração OAuth incompleta');
      }
      
      console.log('✅ Configurações OAuth verificadas para /auth/vendedor/google');
      console.log('Client ID:', googleClientId.substring(0, 10) + '...');
      console.log('Callback URL:', callbackUrl);
      
      // Armazenar tipo de usuário na sessão
      req.session = req.session || {};
      req.session.userType = 'vendedor';
      console.log('✅ Sessão configurada, redirecionando para Google...');
      
      // O Passport redireciona para o Google
    } catch (error) {
      console.error('❌ Erro no endpoint /auth/vendedor/google:', error);
      throw error;
    }
  }
@Get('entregador')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Login de Entregador com Google',
    description: 'Inicia autenticação Google para entregadores. Requer aprovação posterior.'
  })
  @ApiResponse({
    status: 302,
    description: 'Redireciona para o Google OAuth'
  })  async googleAuthEntregador(@Req() req) {
    // Armazenar tipo de usuário na sessão
    req.session = req.session || {};
    req.session.userType = 'entregador';
    // O Passport redireciona para o Google
  }  @Get('entregador/google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Login com Google (Entregador) - Compatibilidade',
    description: 'Endpoint de compatibilidade. Use /auth/entregador para nova implementação.'
  })
  @ApiResponse({
    status: 302,
    description: 'Redireciona para o Google OAuth'
  })
  async googleAuthEntregadorLegacy(@Req() req) {
    try {
      console.log('=== INICIANDO LOGIN GOOGLE ENTREGADOR/GOOGLE ===');
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Request URL:', req.url);
      
      // Verificar configurações OAuth
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
      
      if (!googleClientId || !callbackUrl) {
        console.error('❌ Configuração OAuth incompleta');
        throw new Error('Configuração OAuth incompleta');
      }
      
      console.log('✅ Configurações OAuth verificadas para /auth/entregador/google');
      console.log('Client ID:', googleClientId.substring(0, 10) + '...');
      console.log('Callback URL:', callbackUrl);
      
      // Armazenar tipo de usuário na sessão
      req.session = req.session || {};
      req.session.userType = 'entregador';
      console.log('✅ Sessão configurada, redirecionando para Google...');
      
      // O Passport redireciona para o Google
    } catch (error) {
      console.error('❌ Erro no endpoint /auth/entregador/google:', error);
      throw error;
    }
  }

  // Endpoints de callback específicos removidos - usando callback unificado

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Callback do Google OAuth (Unificado)',
    description: 'Endpoint unificado chamado pelo Google após autenticação. Determina o tipo baseado no state.'
  })  @ApiResponse({
    status: 302,
    description: 'Redireciona para o frontend com o token JWT como parâmetro na URL.'
  })
  async googleAuthCallback(@Req() req, @Res() res) {    try {
      console.log('=== CALLBACK INICIADO ===');
      console.log('Query params:', req.query);
      console.log('Usuario inicial:', req.user);
      
      let userType = 'user';
      
      // Decodificar state para obter tipo de usuário
      if (req.query.state) {
        try {
          const decoded = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
          userType = decoded.type || 'user';
          console.log('Tipo de usuário decodificado do state:', userType);
        } catch (e) {
          console.log('Erro ao decodificar state:', e);
        }
      }
        console.log('Usuario recebido do Google:', req.user);
      console.log('Tipo de usuário:', userType);        // Verificar se o usuário foi criado corretamente
      if (!req.user) {
        console.error('Nenhum usuário encontrado na requisição');
        
        const isProduction = process.env.NODE_ENV === 'production';
        const forceDevelopmentMode = this.shouldForceDevelopmentMode(req);
        
        if (isProduction && !forceDevelopmentMode) {
          const errorUrl = `https://ze-da-fruta-front.vercel.app/auth/${userType}/callback?error=no_user`;
          return res.redirect(errorUrl);
        } else {
          return res.status(400).json({
            success: false,
            error: 'no_user',
            message: 'Nenhum usuário encontrado na requisição do Google OAuth',
            type: userType,
            environment: forceDevelopmentMode ? 'forced-development' : 'development',
            debug: {
              NODE_ENV: process.env.NODE_ENV,
              isProduction: isProduction,
              forceDevelopmentMode: forceDevelopmentMode
            }
          });
        }
      }
      
      // Se o usuário foi criado com tipo diferente, re-autenticar
      if (req.user && userType !== 'user') {
        try {
          const profile = {
            id: req.user.googleId,
            emails: [{ value: req.user.email }],
            displayName: req.user.nome,
            name: { givenName: req.user.nome.split(' ')[0], familyName: req.user.nome.split(' ').slice(1).join(' ') }
          };
          console.log('Re-autenticando usuário com perfil:', profile, 'tipo:', userType);
          req.user = await this.authService.autenticarComGoogle(profile, userType as 'user' | 'vendedor' | 'entregador');
          console.log('Usuário re-autenticado:', req.user);        } catch (error: any) {
          console.error('Erro na re-autenticação:', error);
          
          const isProduction = process.env.NODE_ENV === 'production';
          const forceDevelopmentMode = this.shouldForceDevelopmentMode(req);
          
          if (isProduction && !forceDevelopmentMode) {
            const errorUrl = `https://ze-da-fruta-front.vercel.app/auth/${userType}/callback?error=reauth_failed`;
            return res.redirect(errorUrl);
          } else {
            return res.status(500).json({
              success: false,
              error: 'reauth_failed',
              message: 'Falha na re-autenticação do usuário',
              details: error?.message || String(error),
              type: userType,
              environment: forceDevelopmentMode ? 'forced-development' : 'development',
              debug: {
                NODE_ENV: process.env.NODE_ENV,
                isProduction: isProduction,
                forceDevelopmentMode: forceDevelopmentMode
              }
            });
          }
        }
      }
        // Gerar token JWT
      let token;
      if (req.user) {        try {
          console.log('Tentando gerar token para usuário:', req.user.id, 'tipo:', userType);
          const tokenData = await this.authService.generateJwtToken(req.user, userType as 'user' | 'vendedor' | 'entregador');
          token = tokenData.access_token;
          console.log('Token gerado com sucesso:', token ? 'SIM' : 'NÃO');        } catch (error: any) {
          console.error('Erro ao gerar token:', error);
          
          const isProduction = process.env.NODE_ENV === 'production';
          const forceDevelopmentMode = this.shouldForceDevelopmentMode(req);
          
          if (isProduction && !forceDevelopmentMode) {
            const baseUrl = this.getCallbackBaseUrl(req);
            const errorUrl = `${baseUrl}/auth/callback?error=token_failed&type=${userType}`;
            return res.redirect(errorUrl);
          } else {
            return res.status(500).json({
              success: false,
              error: 'token_failed',
              message: 'Falha na geração do token JWT',
              details: error?.message || String(error),
              type: userType,
              environment: forceDevelopmentMode ? 'forced-development' : 'development',
              debug: {
                NODE_ENV: process.env.NODE_ENV,
                isProduction: isProduction,
                forceDevelopmentMode: forceDevelopmentMode
              }
            });
          }
        }
      }      // ===== COMPORTAMENTO DIFERENTE POR AMBIENTE =====
      const isProduction = process.env.NODE_ENV === 'production';
      const forceDevelopmentMode = this.shouldForceDevelopmentMode(req);
      
      console.log('🔍 Detecção de ambiente:');
      console.log('- NODE_ENV:', process.env.NODE_ENV);
      console.log('- isProduction:', isProduction);
      console.log('- forceDevelopmentMode:', forceDevelopmentMode);
      console.log('- Query params:', req.query);
      
      if (isProduction && !forceDevelopmentMode) {
        // ===== PRODUÇÃO: REDIRECIONAR PARA FRONTEND =====
        const baseUrl = this.getCallbackBaseUrl(req);
        
        let url;
        switch (userType) {
          case 'vendedor':
            url = `${baseUrl}/auth/vendedor/callback?token=${token}&type=vendedor`;
            break;
          case 'entregador':
            url = `${baseUrl}/auth/entregador/callback?token=${token}&type=entregador`;
            break;
          default:
            url = `${baseUrl}/comprador/dashboard?token=${token}&type=user`;
        }
        
        console.log('🏭 PRODUÇÃO: Redirecionando para frontend:', url);
        if (token) {
          return res.redirect(url);
        }
        
        const errorUrl = `${baseUrl}/auth/callback?error=auth_failed&type=${userType}`;
        console.log('Redirecionando para URL de erro:', errorUrl);
        return res.redirect(errorUrl);
        
      } else {
        // ===== DESENVOLVIMENTO: MOSTRAR TOKEN NA RESPOSTA =====
        console.log('🔧 DESENVOLVIMENTO: Retornando token como JSON para testes');
        console.log('Motivo: ' + (forceDevelopmentMode ? 'Modo dev forçado via query param' : 'NODE_ENV não é production'));
        
        if (token) {
          return res.json({
            success: true,
            message: 'Autenticação realizada com sucesso!',
            access_token: token,
            user: {
              id: req.user.id,
              nome: req.user.nome,
              email: req.user.email,
              type: userType,
              roles: req.user.roles?.map(r => r.nome) || []
            },
            environment: forceDevelopmentMode ? 'forced-development' : 'development',
            debug: {
              NODE_ENV: process.env.NODE_ENV,
              isProduction: isProduction,
              forceDevelopmentMode: forceDevelopmentMode
            },
            instructions: [
              '✅ Token gerado com sucesso!',
              '📋 Copie o "access_token" acima para usar em suas requisições',
              '🔗 Use este token no header: Authorization: Bearer <token>',
              '🚀 Exemplo: Authorization: Bearer ' + token.substring(0, 50) + '...',
              forceDevelopmentMode ? '💡 Modo de desenvolvimento forçado via query param' : '💡 Modo de desenvolvimento detectado automaticamente'
            ]
          });
        }
        
        return res.status(400).json({
          success: false,
          error: 'auth_failed',
          message: 'Falha na autenticação',
          type: userType,
          environment: forceDevelopmentMode ? 'forced-development' : 'development',
          debug: {
            NODE_ENV: process.env.NODE_ENV,
            isProduction: isProduction,
            forceDevelopmentMode: forceDevelopmentMode
          }
        });
      }    } catch (error: any) {
      console.error('=== ERRO NO CALLBACK DO GOOGLE ===');
      console.error('Erro completo:', error);
      console.error('Stack trace:', error?.stack);
      
      const isProduction = process.env.NODE_ENV === 'production';
      const forceDevelopmentMode = this.shouldForceDevelopmentMode(req);
      
      if (isProduction && !forceDevelopmentMode) {
        // ===== PRODUÇÃO: REDIRECIONAR PARA FRONTEND COM ERRO =====
        const baseUrl = this.getCallbackBaseUrl(req);
        const errorUrl = `${baseUrl}/auth/callback?error=server_error&details=${encodeURIComponent(error?.message || 'Erro desconhecido')}`;
        
        console.log('🏭 PRODUÇÃO: Redirecionando para URL de erro:', errorUrl);
        return res.redirect(errorUrl);
      } else {
        // ===== DESENVOLVIMENTO: MOSTRAR ERRO COMO JSON =====
        console.log('🔧 DESENVOLVIMENTO: Retornando erro como JSON');
        return res.status(500).json({
          success: false,
          error: 'server_error',
          message: 'Erro interno no callback do Google OAuth',
          details: error?.message || 'Erro desconhecido',
          stack: error?.stack,
          environment: forceDevelopmentMode ? 'forced-development' : 'development',
          debug: {
            NODE_ENV: process.env.NODE_ENV,
            isProduction: isProduction,
            forceDevelopmentMode: forceDevelopmentMode
          },
          troubleshooting: [
            '🔍 Verifique os logs acima para mais detalhes',
            '⚙️ Confirme se as variáveis de ambiente OAuth estão configuradas',
            '🔗 Teste novamente: http://localhost:3000/auth/user',
            forceDevelopmentMode ? '💡 Para forçar produção, remova ?dev=true da URL' : '💡 Para forçar modo dev, adicione ?dev=true na URL de login'
          ]
        });
      }
    }
  }

  @Post('admin/login')
  @HttpCode(200)
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
          properties: {
            id: { type: 'string', example: 'uuid-do-admin' },
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
  })
  async adminLogin(@Body() loginAdminDto: LoginAdminDto) {
    return this.authService.loginAdmin(loginAdminDto);
  }

  // ====== ENDPOINTS PARA TESTE/DESENVOLVIMENTO ======
  
  @Post('google/simulate')
  @Public()
  @ApiOperation({
    summary: '🧪 Simular autenticação Google (DESENVOLVIMENTO)',
    description: 'Endpoint para simular autenticação Google durante desenvolvimento e testes automatizados. NÃO USAR EM PRODUÇÃO!'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        profile: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'google-test-123' },
            emails: { 
              type: 'array', 
              items: { 
                type: 'object', 
                properties: { value: { type: 'string', example: 'teste@gmail.com' } } 
              } 
            },
            displayName: { type: 'string', example: 'Usuario Teste' },
            name: {
              type: 'object',
              properties: {
                givenName: { type: 'string', example: 'Usuario' },
                familyName: { type: 'string', example: 'Teste' }
              }
            }
          }
        },
        tipoUsuario: { 
          type: 'string', 
          enum: ['user', 'vendedor', 'entregador'], 
          example: 'vendedor' 
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado/autenticado com sucesso',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            nome: { type: 'string' },
            email: { type: 'string' },
            type: { type: 'string' },
            roles: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  })
  async googleSimulate(@Body() body: { profile: any; tipoUsuario?: 'user' | 'vendedor' | 'entregador' }) {
    const { profile, tipoUsuario = 'user' } = body;
    
    // Validar se está em ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('Endpoint de simulação não disponível em produção');
    }
    
    const usuario = await this.authService.autenticarComGoogle(profile, tipoUsuario);
    return usuario;
  }

  @Post('token')
  @Public()
  @ApiOperation({
    summary: '🧪 Obter token JWT para testes (DESENVOLVIMENTO)',
    description: 'Endpoint para obter token JWT baseado em email durante testes. NÃO USAR EM PRODUÇÃO!'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'vendedor@gmail.com' },
        provider: { type: 'string', example: 'google' },
        role: { type: 'string', example: 'SELLER' }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Token JWT retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            nome: { type: 'string' },
            email: { type: 'string' },
            roles: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  })
  async obterTokenTeste(@Body() body: { email: string; provider?: string; role?: string }) {
    // Validar se está em ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('Endpoint de teste não disponível em produção');
    }
    
    const usuario = await this.authService.obterUsuarioPorEmail(body.email);
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }
    
    const token = this.authService.generateJWT(usuario);
    
    return {
      access_token: token,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        roles: usuario.roles?.map(r => r.nome) || []
      }
    };
  }

  /**
   * Determina a URL base para callbacks baseada no ambiente e parâmetros da requisição
   */
  private getCallbackBaseUrl(req: any): string {
    // 1. Verificar se há callback_url nos parâmetros da query
    if (req.query?.callback_url) {
      console.log('🔗 Usando callback_url da query:', req.query.callback_url);
      return req.query.callback_url;
    }

    // 2. Verificar variável de ambiente específica
    const frontendUrl = process.env.FRONTEND_URL;
    if (frontendUrl) {
      console.log('🔗 Usando FRONTEND_URL do ambiente:', frontendUrl);
      return frontendUrl;
    }

    // 3. Detectar ambiente automaticamente
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // Em produção, usar Vercel
      const productionUrl = 'https://ze-da-fruta-front.vercel.app';
      console.log('🔗 Ambiente de produção detectado, usando:', productionUrl);
      return productionUrl;
    } else {
      // Em desenvolvimento, usar localhost
      const developmentUrl = 'http://localhost:3001';
      console.log('🔗 Ambiente de desenvolvimento detectado, usando:', developmentUrl);
      return developmentUrl;
    }
  }

  /**
   * Força o comportamento de desenvolvimento independente do NODE_ENV
   * Para usar, adicione ?dev=true no URL de login
   */
  private shouldForceDevelopmentMode(req: any): boolean {
    return req.query?.dev === 'true' || req.query?.development === 'true' || req.query?.local === 'true';
  }
}
