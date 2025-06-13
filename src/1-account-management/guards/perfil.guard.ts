import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PerfilUsuario } from '../../common/entities/perfil-usuario.entity';

export const PERFIL_KEY = 'perfil';
export const Perfil = (...perfis: PerfilUsuario[]) => SetMetadata(PERFIL_KEY, perfis);

@Injectable()
export class PerfilGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const requiredPerfis = this.reflector.getAllAndOverride<PerfilUsuario[]>(PERFIL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPerfis) return true;
    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.perfis) return false;
    // user.perfis pode ser um array de strings ou objetos
    const perfis = Array.isArray(user.perfis) ? user.perfis : [user.perfis];
    return perfis.some((perfil: any) => requiredPerfis.includes(perfil.perfil || perfil));
  }
}

export { PerfilUsuario };
