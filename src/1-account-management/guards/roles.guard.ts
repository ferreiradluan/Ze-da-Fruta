import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/entities/user.entity';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {
    console.log('RolesGuard (GUARDS) CONSTRUTOR chamado');
  }  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    // LOG detalhado
    console.log('RolesGuard (GUARDS) - requiredRoles:', requiredRoles, '| user:', user, '| user.roles:', user?.roles, '| user.role:', user?.role);
    if (!user) {
      return false;
    }
    
    // Suporte para user.roles (array) e user.role (string)
    const userRoles = user.roles || (user.role ? [user.role] : []);
    
    // ✅ ADMIN TEM ACESSO A TUDO - SEMPRE!
    if (userRoles.includes('ADMIN')) {
      console.log('✅ RolesGuard (GUARDS): Acesso permitido - usuário é ADMIN (acesso total)');
      return true;
    }
    
    // Verificar se o usuário possui alguma das roles requeridas
    return requiredRoles.some((requiredRole) => 
      userRoles.some((userRole: string) => String(userRole) === String(requiredRole))
    );
  }
}