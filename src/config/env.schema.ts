import { z } from 'zod/v4';
import { NodeEnvironment } from '@/core/enums';

export const envSchema = z
  .object({
    // Server
    NODE_ENV: z
      .enum(Object.values(NodeEnvironment) as [NodeEnvironment, ...NodeEnvironment[]])
      .default(NodeEnvironment.DEVELOPMENT),
    PORT: z.coerce.number().default(3398),

    // Database
    DB_HOST: z.string().default('localhost'),
    DB_PORT: z.coerce.number().default(5433),
    DB_USERNAME: z.string().default('postgres'),
    DB_PASSWORD: z.string().default('Password123'),
    DB_NAME: z.string().default('products-service'),

    // Swagger
    SWAGGER_PATH: z.string().default('api/docs'),
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
