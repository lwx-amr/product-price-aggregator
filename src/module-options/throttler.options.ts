import type { Environment } from '@config';
import { ConfigService } from '@nestjs/config';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';

export function buildThrottlerOptions(
  configService: ConfigService<Environment, true>,
): ThrottlerModuleOptions {
  return {
    throttlers: [
      {
        name: 'short',
        ttl: configService.get('THROTTLE_SHORT_TTL', { infer: true }),
        limit: configService.get('THROTTLE_SHORT_LIMIT', { infer: true }),
      },
      {
        name: 'medium',
        ttl: configService.get('THROTTLE_MEDIUM_TTL', { infer: true }),
        limit: configService.get('THROTTLE_MEDIUM_LIMIT', { infer: true }),
      },
      {
        name: 'long',
        ttl: configService.get('THROTTLE_LONG_TTL', { infer: true }),
        limit: configService.get('THROTTLE_LONG_LIMIT', { infer: true }),
      },
    ],
  };
}
