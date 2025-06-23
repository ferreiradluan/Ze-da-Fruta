import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // Se não há roles requeridas, permite acesso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new ForbiddenException('Usuário não autenticado.');
    }
    
    // Debug log para entender o problema
    console.log('🔍 RolesGuard Debug:', {
      requiredRoles,
      userRoles: user?.roles,
      userId: user?.id,
      userType: user?.type
    });
    
    // ✅ ADMIN TEM ACESSO A TUDO - SEMPRE!
    if (user.roles && user.roles.includes('ADMIN')) {
      console.log('✅ Acesso permitido: usuário é ADMIN (acesso total)');
      return true;
    }
    
    // ✅ LÓGICA PRINCIPAL: Verificar se usuário tem permissão
    
    // 1. Se usuário tem roles definidas, verificar se alguma bate com as requeridas
    if (user.roles && user.roles.length > 0) {
      const hasRole = user.roles.some((role: string) => requiredRoles.includes(role));
      if (hasRole) {
        console.log('✅ Acesso permitido: usuário tem role necessária');
        return true;
      }
    }
    
    // 2. Se usuário não tem roles mas é type 'user' e endpoint requer 'user', permite
    if ((!user.roles || user.roles.length === 0) && user.type === 'user' && requiredRoles.includes('user')) {
      console.log('✅ Acesso permitido: usuário type "user" acessando endpoint que requer role "user"');
      return true;
    }
    
    // 3. Se chegou até aqui, não tem permissão
    console.log('❌ Acesso negado: usuário não tem permissão necessária');
    throw new ForbiddenException('Acesso negado: papel insuficiente.');
  }
}
