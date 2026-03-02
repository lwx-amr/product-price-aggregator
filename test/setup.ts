import type { Environment } from '@config';
import { NodeEnvironment } from '@core/enums/environment.enum';
import { ConfigService } from '@nestjs/config';

const testDefaults: Environment = {
  NODE_ENV: NodeEnvironment.TEST,
  PORT: 3398,
  DB_HOST: 'DB_HOST',
  DB_PORT: 5433,
  DB_USERNAME: 'DB_USERNAME',
  DB_PASSWORD: 'DB_PASSWORD',
  DB_NAME: 'DB_NAME',
  DATABASE_URL: 'DATABASE_URL',
  SWAGGER_PATH: 'api/docs',
  SIM_MUTATION_INTERVAL_MS: 5000,
  SIM_FAILURE_RATE: 0.1,
  SIM_MAX_DELAY_MS: 0,
  PROVIDER_A_URL: 'http://localhost:3398/api/v1/sim/providers/a/products',
  PROVIDER_B_URL: 'http://localhost:3398/api/v1/sim/providers/b/items',
  PROVIDER_C_URL: 'http://localhost:3398/api/v1/sim/providers/c/catalog',
  PROVIDER_TIMEOUT_MS: 3000,
  RETRY_COUNT: 3,
  RETRY_BACKOFF_MS: 500,
  FETCH_INTERVAL_MS: 30000,
  STALE_THRESHOLD_MS: 90000,
};

/**
 * Creates a mock ConfigService provider for use in Test.createTestingModule().
 * Merges overrides on top of safe test defaults.
 */
global.mockConfigProvider = (overrides: Partial<Environment> = {}) => {
  const config = { ...testDefaults, ...overrides };

  return {
    provide: ConfigService,
    useValue: {
      get: jest.fn(<T extends keyof Environment>(key: T) => config[key]),
    },
  };
};
