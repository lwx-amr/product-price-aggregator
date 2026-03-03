import type { Environment } from '@config';
import { API_KEY_HEADER } from '@core/constants';
import { Public } from '@core/decorators';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
  let reflector: Reflector;
  let configService: ConfigService<Environment, true>;
  let guard: ApiKeyGuard;

  beforeAll(() => {
    reflector = new Reflector();
    configService = {
      get: jest.fn(<T extends keyof Environment>(key: T) => {
        const config: Pick<Environment, 'API_KEY' | 'SWAGGER_PATH'> = {
          API_KEY: 'secret',
          SWAGGER_PATH: 'api/docs',
        };

        return config[key as 'API_KEY' | 'SWAGGER_PATH'];
      }),
    } as unknown as ConfigService<Environment, true>;

    guard = new ApiKeyGuard(reflector, configService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows public routes', () => {
    class PublicController {
      @Public()
      handler(): void {}
    }

    const instance = new PublicController();
    const context = createExecutionContext({
      path: '/products',
      headerValue: undefined,
      handler: instance.handler,
      controller: PublicController,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws when the API key header is missing or invalid', () => {
    const context = createExecutionContext({
      path: '/api/v1/products',
      headerValue: 'wrong',
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('allows protected routes when the API key matches', () => {
    const context = createExecutionContext({
      path: '/api/v1/products',
      headerValue: ' secret ',
    });

    expect(guard.canActivate(context)).toBe(true);
  });
});

interface ExecutionContextOptions {
  path: string;
  headerValue: string | undefined;
  handler?: () => void;
  controller?: new () => object;
}

function createExecutionContext(options: ExecutionContextOptions): ExecutionContext {
  const controller = options.controller ?? class TestController {};
  const handler = options.handler ?? (() => undefined);

  return {
    switchToHttp: () => ({
      getRequest: () => ({
        path: options.path,
        header: (name: string) => (name === API_KEY_HEADER ? options.headerValue : undefined),
      }),
      getResponse: () => undefined,
      getNext: () => undefined,
    }),
    getClass: () => controller,
    getHandler: () => handler,
    getArgs: () => [],
    getArgByIndex: () => undefined,
    getType: () => 'http',
    switchToRpc: () => ({ getContext: () => undefined, getData: () => undefined }),
    switchToWs: () => ({ getClient: () => undefined, getData: () => undefined }),
  };
}
