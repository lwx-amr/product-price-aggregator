import type { Environment } from '../src/config/env.schema';
import type { ConfigService } from '@nestjs/config';

declare global {
  function mockConfigProvider(overrides?: Partial<Environment>): {
    provide: typeof ConfigService;
    useValue: {
      get: jest.Mock;
    };
  };
}
