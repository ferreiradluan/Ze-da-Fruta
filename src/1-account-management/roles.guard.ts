import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './role.enum';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {
    console.log('RolesGuard CONSTRUTOR chamado');
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // LOG para depuração detalhada
    console.log('RolesGuard - requiredRoles:', requiredRoles, '| user:', user, '| user.role:', user?.role, '| user.profileType:', user?.profileType);
    
    if (!user) {
      return false;
    }

    // Forçar comparação de string
    return requiredRoles.some((role) => String(user.role) === String(role) || String(user.profileType) === String(role));
  }
}