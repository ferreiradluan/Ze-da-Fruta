import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class MemorySessionGuard implements CanActivate {
  private static activeTokens: Set<string> = new Set();

  static addToken(token: string) {
    this.activeTokens.add(token);
  }

  static removeToken(token: string) {
    this.activeTokens.delete(token);
  }

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];
    if (!authHeader) return false;
    const token = authHeader.replace('Bearer ', '');
    return MemorySessionGuard.activeTokens.has(token);
  }
}
