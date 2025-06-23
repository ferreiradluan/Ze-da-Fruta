import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerStorage } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModuleOptions } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
    private configService: ConfigService,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use different tracking keys for different types of users
    if (req.apiKeyId) {
      return `api-key-${req.apiKeyId}`;
    }
    
    if (req.user) {
      return `user-${req.user.id}`;
    }
    
    // For anonymous users, use IP
    return req.ip;
  }

  protected getThrottlers(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // API key users get higher limits
    if (request.apiKeyId) {
      return [
        {
          name: 'api-key',
          ttl: parseInt(this.configService.get('RATE_LIMIT_API_KEY_TTL', '60')) * 1000,
          limit: parseInt(this.configService.get('RATE_LIMIT_API_KEY_LIMIT', '1000')),
        },
      ];
    }
    
    // Authenticated users get medium limits
    if (request.user) {
      return [
        {
          name: 'authenticated',
          ttl: parseInt(this.configService.get('RATE_LIMIT_AUTH_TTL', '60')) * 1000,
          limit: parseInt(this.configService.get('RATE_LIMIT_AUTH_LIMIT', '300')),
        },
      ];
    }
      // Public users get lower limits
    return [
      {
        name: 'public',
        ttl: parseInt(this.configService.get('RATE_LIMIT_PUBLIC_TTL', '60')) * 1000,
        limit: parseInt(this.configService.get('RATE_LIMIT_PUBLIC_LIMIT', '100')),
      },
    ];
  }
}
