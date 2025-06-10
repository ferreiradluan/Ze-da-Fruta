import { applyDecorators } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

/**
 * Apply different throttling rules based on endpoint type
 */
export const ThrottlePublic = () => 
  applyDecorators(
    Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute for public endpoints
  );

export const ThrottleAuthenticated = () =>
  applyDecorators(
    Throttle({ default: { limit: 300, ttl: 60000 } }) // 300 requests per minute for authenticated endpoints
  );

export const ThrottleApiKey = () =>
  applyDecorators(
    Throttle({ default: { limit: 1000, ttl: 60000 } }) // 1000 requests per minute for API key endpoints
  );

export const ThrottleHeavy = () =>
  applyDecorators(
    Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute for heavy operations
  );
