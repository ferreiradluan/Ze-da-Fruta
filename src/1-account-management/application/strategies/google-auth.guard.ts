import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../services/auth.service';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly authService: AuthService) {
    super();
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // Detectar tipo de usuário baseado na URL
    const path = request.path || request.url;
    let tipoUsuario = 'user';
    
    if (path.includes('/vendedor')) {
      tipoUsuario = 'vendedor';
    } else if (path.includes('/entregador')) {
      tipoUsuario = 'entregador';
    }
    
    // Armazenar no request para uso posterior
    request._tipoUsuario = tipoUsuario;
    
    return {
      state: Buffer.from(JSON.stringify({ type: tipoUsuario })).toString('base64')
    };
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    console.log('=== GoogleAuthGuard - canActivate iniciado ===');
    console.log('Request path:', request.path);
    console.log('Request query:', request.query);
    
    // Se há state na query, decodificar tipo
    if (request.query.state) {
      try {
        const decoded = JSON.parse(Buffer.from(request.query.state, 'base64').toString());
        request._tipoUsuario = decoded.type || 'user';
        console.log('Tipo decodificado do state:', request._tipoUsuario);
      } catch (e) {
        console.log('Erro ao decodificar state, usando user como padrão:', e);
        request._tipoUsuario = 'user';
      }
    }
    
    try {
      const result = (await super.canActivate(context)) as boolean;
      console.log('Super canActivate result:', result);
      console.log('User após autenticação:', request.user);
      
      if (result && request.user) {
        // Apenas armazenar o tipo, não gerar token aqui
        request.user.type = request._tipoUsuario || 'user';
        console.log('Tipo de usuário atribuído:', request.user.type);
      }
      
      return result;    } catch (error: any) {
      console.error('=== ERRO NO GoogleAuthGuard ===');
      console.error('Erro completo:', error);
      console.error('Stack trace:', error?.stack);
      throw error;
    }
  }
}
