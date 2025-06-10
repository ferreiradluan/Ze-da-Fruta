import { ConfigService } from '@nestjs/config';

export interface SecurityConfig {
  rateLimiting: {
    // Rate limits for public endpoints
    public: {
      ttl: number; // Time window in seconds
      limit: number; // Max requests per window
    };
    // Rate limits for authenticated endpoints
    authenticated: {
      ttl: number;
      limit: number;
    };
    // Rate limits for API key users (high-volume clients)
    apiKey: {
      ttl: number;
      limit: number;
    };
  };
  cors: {
    origin: string | boolean;
    credentials: boolean;
  };
  helmet: {
    enabled: boolean;
    options: any;
  };
}

export const getSecurityConfig = (configService: ConfigService): SecurityConfig => ({
  rateLimiting: {
    public: {
      ttl: parseInt(configService.get('RATE_LIMIT_PUBLIC_TTL', '60')), // 1 minute
      limit: parseInt(configService.get('RATE_LIMIT_PUBLIC_LIMIT', '100')), // 100 requests per minute
    },
    authenticated: {
      ttl: parseInt(configService.get('RATE_LIMIT_AUTH_TTL', '60')), // 1 minute
      limit: parseInt(configService.get('RATE_LIMIT_AUTH_LIMIT', '300')), // 300 requests per minute
    },
    apiKey: {
      ttl: parseInt(configService.get('RATE_LIMIT_API_KEY_TTL', '60')), // 1 minute
      limit: parseInt(configService.get('RATE_LIMIT_API_KEY_LIMIT', '1000')), // 1000 requests per minute
    },
  },
  cors: {
    origin: configService.get('CORS_ORIGIN', process.env.NODE_ENV === 'production' ? false : true),
    credentials: true,
  },
  helmet: {
    enabled: configService.get('HELMET_ENABLED', 'true') === 'true',
    options: {
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    },
  },
});
