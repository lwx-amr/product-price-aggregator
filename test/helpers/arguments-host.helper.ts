interface HttpResponseMock {
  status: jest.Mock;
  json: jest.Mock;
}

export function createHttpArgumentsHost(response: HttpResponseMock): any {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({}),
      getNext: () => undefined,
    }),
    getArgByIndex: () => undefined,
    getArgs: () => [],
    getType: () => 'http',
    switchToRpc: () => ({ getContext: () => undefined, getData: () => undefined }),
    switchToWs: () => ({ getClient: () => undefined, getData: () => undefined }),
  };
}
