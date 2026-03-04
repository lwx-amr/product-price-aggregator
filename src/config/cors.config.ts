import { NodeEnvironment } from '@core/enums';
import { Logger } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const logger = new Logger('CORS');

export const getCorsConfig = (allowedOrigins: string, nodeEnv: string): CorsOptions => {
  const isProduction = nodeEnv === NodeEnvironment.PRODUCTION;

  const origins = allowedOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  return {
    origin: (origin, callback): void => {
      // Allow server-to-server requests (no origin header)
      if (!origin) {
        return callback(null, true);
      }

      // In development, allow all origins
      if (!isProduction) {
        return callback(null, true);
      }

      if (origins.includes(origin)) {
        return callback(null, true);
      }

      logger.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error(`Origin '${origin}' is not allowed by CORS policy`), false);
    },
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-api-key'],
    maxAge: 86_400,
    optionsSuccessStatus: 204,
  };
};
