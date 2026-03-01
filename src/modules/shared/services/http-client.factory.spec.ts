import { Test, TestingModule } from '@nestjs/testing';
import { HttpClientFactory } from './http-client.factory';

describe('HttpClientFactory', () => {
  let module: TestingModule;
  let httpClientFactory: HttpClientFactory;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [HttpClientFactory, mockConfigProvider()],
    }).compile();

    httpClientFactory = module.get<HttpClientFactory>(HttpClientFactory);
  });

  afterAll(async () => {
    await module.close();
  });

  it('creates a client with config-based defaults', () => {
    const client = httpClientFactory.create({
      baseUrl: 'https://provider-a.example.com',
      label: 'Provider A',
    });

    expect((client as any).options).toEqual({
      baseUrl: 'https://provider-a.example.com',
      label: 'Provider A',
      timeoutMs: 3000,
      retries: 3,
      backoffMs: 500,
    });
  });
});
