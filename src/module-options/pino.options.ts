import type { Environment } from '@config';
import { NodeEnvironment } from '@core/enums';
import { ConfigService } from '@nestjs/config';
import { IncomingMessage, ServerResponse } from 'http';
import { Params } from 'nestjs-pino';

export function buildPinoOptions(config: ConfigService<Environment, true>): Params {
  const nodeEnv = config.get('NODE_ENV', { infer: true });
  const isDevelopment = nodeEnv === NodeEnvironment.DEVELOPMENT;

  return {
    pinoHttp: {
      autoLogging: false,
      level: isDevelopment ? 'debug' : 'info',
      serializers: {
        req: (req: IncomingMessage & { method?: string; url?: string }) => ({
          method: req.method,
          url: req.url,
        }),
        res: (res: ServerResponse & { statusCode?: number }) => ({
          statusCode: res.statusCode,
        }),
      },
      transport: isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
              singleLine: true,
            },
          }
        : undefined,
    },
  };
}
