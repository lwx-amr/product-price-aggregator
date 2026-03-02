import { NodeEnvironment } from '@/core/enums';
import { z } from 'zod/v4';

export const envSchema = z
  .object({
    // Server
    NODE_ENV: z.enum(Object.values(NodeEnvironment) as [NodeEnvironment, ...NodeEnvironment[]]),
    PORT: z.coerce.number(),

    // Database
    DB_HOST: z.string(),
    DB_PORT: z.coerce.number(),
    DB_USERNAME: z.string(),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string(),

    // Swagger
    SWAGGER_PATH: z.string(),

    // Simulated providers
    SIM_MUTATION_INTERVAL_MS: z.coerce.number().int().positive(),
    SIM_FAILURE_RATE: z.coerce.number().min(0).max(1),
    SIM_MAX_DELAY_MS: z.coerce.number().int().nonnegative(),

    // Provider adapters
    PROVIDER_A_URL: z.url(),
    PROVIDER_B_URL: z.url(),
    PROVIDER_C_URL: z.url(),
    PROVIDER_TIMEOUT_MS: z.coerce.number().int().positive(),
    RETRY_COUNT: z.coerce.number().int().nonnegative(),
    RETRY_BACKOFF_MS: z.coerce.number().int().positive(),
    FETCH_INTERVAL_MS: z.coerce.number().int().positive(),
    STALE_THRESHOLD_MS: z.coerce.number().int().positive(),
  })
  .transform((env) => ({
    ...env,
    DATABASE_URL: `postgresql://${env.DB_USERNAME}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`,
  }));

export type Environment = z.infer<typeof envSchema>;

export function validate(config: Record<string, unknown>): Environment {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const formatted = z.prettifyError(result.error);
    throw new Error(`Environment validation failed:\n${formatted}`);
  }
  return result.data;
}
