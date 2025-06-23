import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../services/auth.service';

@Injectable()
export class GoogleVendedorAuthGuard extends AuthGuard('google-vendedor') {
  constructor(private readonly authService: AuthService) {
    super();
  }  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = (await super.canActivate(context)) as boolean;
    const request = context.switchToHttp().getRequest();
    
    if (result && request.user) {
      // Gerar JWT token após autenticação bem-sucedida
      const tokenData = await this.authService.generateJwtToken(request.user);
      request.user.token = tokenData.access_token;
    }
    
    return result;
  }
}
