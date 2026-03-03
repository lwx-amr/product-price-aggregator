import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { NodeEnvironment } from '../enums';

/**
 * Logging Interceptor - logs all requests/responses with execution time
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @InjectPinoLogger(LoggingInterceptor.name)
    private readonly logger: PinoLogger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<{ method: string; originalUrl?: string; url: string }>();
    const response = ctx.getResponse<Response>();
    const method = request.method;
    const url = request.originalUrl ?? request.url;
    if (url === '/api/v1/health') {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data: unknown) => {
          const executionTime = Date.now() - startTime;
          const { statusCode } = response;

          this.logger.info(
            {
              type: 'http',
              method,
              url,
              statusCode,
              durationMs: executionTime,
            },
            'HTTP request completed',
          );

          if (process.env.NODE_ENV === NodeEnvironment.DEVELOPMENT && data) {
            const responsePreview = JSON.stringify(data).substring(0, 500);
            this.logger.debug({ responsePreview }, 'Response Preview');
          }
        },
        error: (error: unknown) => {
          const executionTime = Date.now() - startTime;

          const statusCode =
            response.statusCode && response.statusCode !== 200 ? response.statusCode : 500;

          this.logger.error(
            {
              type: 'http',
              method,
              url,
              statusCode,
              durationMs: executionTime,
              err: error instanceof Error ? error : undefined,
            },
            'HTTP request failed',
          );
        },
      }),
    );
  }
}
