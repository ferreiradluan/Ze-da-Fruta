import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../../../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Log para debug
    console.log('JWT Guard - handleRequest:', { 
      err: err?.message, 
      user: user ? { id: user.id, email: user.email, roles: user.roles, status: user.status } : null, 
      info: info?.message 
    });

    if (err) {
      console.log('JWT Guard - Error:', err);
      throw err;
    }
    
    if (!user) {
      console.log('JWT Guard - No user found, info:', info);
      throw new UnauthorizedException('Token JWT inválido ou ausente.');
    }
    
    return user;
  }
}
