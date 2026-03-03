export function createHttpExecutionContext(method: string, path: string, statusCode: number): any {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method,
        url: path,
        originalUrl: path,
      }),
      getResponse: () => ({
        statusCode,
      }),
      getNext: () => undefined,
    }),
    getArgs: () => [],
    getArgByIndex: () => undefined,
    getClass: () => class TestController {},
    getHandler: () => () => undefined,
    getType: () => 'http',
    switchToRpc: () => ({ getContext: () => undefined, getData: () => undefined }),
    switchToWs: () => ({ getClient: () => undefined, getData: () => undefined }),
  };
}
