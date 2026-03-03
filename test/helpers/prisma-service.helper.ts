import type { Environment } from '@config';
import type { ConfigService } from '@nestjs/config';
import type { PinoLogger } from 'nestjs-pino';

export function createPrismaConfigService(): ConfigService<Environment, true> {
  return {
    get: jest.fn(<T extends keyof Environment>(key: T) => {
      const config = {
        DATABASE_URL: 'postgresql://postgres:Password123@localhost:5433/products-service',
      } satisfies Pick<Environment, 'DATABASE_URL'>;

      return config[key as 'DATABASE_URL'];
    }),
  } as unknown as ConfigService<Environment, true>;
}

export function createPinoInfoLogger(): Pick<PinoLogger, 'info'> {
  return {
    info: jest.fn(),
  };
}
