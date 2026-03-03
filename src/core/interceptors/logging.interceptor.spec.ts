import { CallHandler } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import { of, throwError } from 'rxjs';
import { createHttpExecutionContext } from '@test/helpers/execution-context.helper';
import { NodeEnvironment } from '../enums';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let logger: Pick<PinoLogger, 'info' | 'error' | 'debug'>;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeAll(() => {
    logger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    interceptor = new LoggingInterceptor(logger as PinoLogger);
  });

  beforeEach(() => {
    (logger.info as jest.Mock).mockReset();
    (logger.error as jest.Mock).mockReset();
    (logger.debug as jest.Mock).mockReset();
    process.env.NODE_ENV = NodeEnvironment.TEST;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('logs the completed request with structured metadata for successful requests', (done) => {
    const context = createHttpExecutionContext('GET', '/api/v1/products', 200);
    const next: CallHandler = {
      handle: () => of({ ok: true }),
    };

    interceptor.intercept(context, next).subscribe({
      complete: () => {
        expect(logger.error).not.toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'http',
            method: 'GET',
            url: '/api/v1/products',
            statusCode: 200,
            durationMs: expect.any(Number),
          }),
          'HTTP request completed',
        );
        expect(logger.debug).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('logs request failures with structured metadata', (done) => {
    const context = createHttpExecutionContext('GET', '/api/v1/products', 500);
    const next: CallHandler = {
      handle: () => throwError(() => new Error('boom')),
    };

    interceptor.intercept(context, next).subscribe({
      error: () => {
        expect(logger.error).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'http',
            method: 'GET',
            url: '/api/v1/products',
            statusCode: 500,
            durationMs: expect.any(Number),
            err: expect.any(Error),
          }),
          'HTTP request failed',
        );
        expect(logger.info).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('skips logging for the health endpoint', (done) => {
    const context = createHttpExecutionContext('GET', '/api/v1/health', 200);
    const next: CallHandler = {
      handle: () => of({ ok: true }),
    };

    interceptor.intercept(context, next).subscribe({
      complete: () => {
        expect(logger.info).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
        expect(logger.debug).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('logs a response preview in development mode', (done) => {
    process.env.NODE_ENV = NodeEnvironment.DEVELOPMENT;
    const context = createHttpExecutionContext('GET', '/api/v1/products', 200);
    const next: CallHandler = {
      handle: () => of({ ok: true, items: [1, 2, 3] }),
    };

    interceptor.intercept(context, next).subscribe({
      complete: () => {
        expect(logger.debug).toHaveBeenCalledWith(
          expect.objectContaining({
            responsePreview: expect.any(String),
          }),
          'Response Preview',
        );
        done();
      },
    });
  });
});
