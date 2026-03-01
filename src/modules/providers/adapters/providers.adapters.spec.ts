import { ProviderName } from '@core/enums';
import { HttpClientFactory } from '@modules/shared/services';
import { Test, TestingModule } from '@nestjs/testing';
import { ProviderAAdapter, ProviderBAdapter, ProviderCAdapter } from './index';
import { ProvidersService } from '../providers.service';

describe('Provider adapters', () => {
  let module: TestingModule;
  let providerAAdapter: ProviderAAdapter;
  let providerBAdapter: ProviderBAdapter;
  let providerCAdapter: ProviderCAdapter;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        ProviderAAdapter,
        ProviderBAdapter,
        ProviderCAdapter,
        HttpClientFactory,
        ProvidersService,
        mockConfigProvider(),
      ],
    }).compile();

    providerAAdapter = module.get<ProviderAAdapter>(ProviderAAdapter);
    providerBAdapter = module.get<ProviderBAdapter>(ProviderBAdapter);
    providerCAdapter = module.get<ProviderCAdapter>(ProviderCAdapter);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  it('normalizes provider A payloads', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'prov-a-nestjs-masterclass',
          name: 'NestJS Masterclass',
          description: 'Advanced NestJS course for backend engineers.',
          price: 79.99,
          currency: 'usd',
          available: true,
          lastUpdated: '2026-02-28T12:00:00.000Z',
        },
      ],
    } as Response);

    await expect(providerAAdapter.fetchProducts()).resolves.toEqual([
      {
        providerName: ProviderName.PROVIDER_A,
        externalId: 'prov-a-nestjs-masterclass',
        canonicalKey: 'nestjs-masterclass',
        name: 'NestJS Masterclass',
        description: 'Advanced NestJS course for backend engineers.',
        price: '79.99',
        currency: 'USD',
        availability: true,
        sourceLastUpdated: new Date('2026-02-28T12:00:00.000Z'),
      },
    ]);
  });

  it('normalizes provider B payloads', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [
        {
          sku: 'prov-b-docker-deep-dive',
          title: 'Docker Deep Dive',
          details: 'E-book covering production Docker patterns and debugging.',
          cost: { amount: 22.95, currency: 'usd' },
          stockStatus: 'out_of_stock',
          updated_at: '2026-02-28T12:00:00Z',
        },
      ],
    } as Response);

    await expect(providerBAdapter.fetchProducts()).resolves.toEqual([
      {
        providerName: ProviderName.PROVIDER_B,
        externalId: 'prov-b-docker-deep-dive',
        canonicalKey: 'docker-deep-dive',
        name: 'Docker Deep Dive',
        description: 'E-book covering production Docker patterns and debugging.',
        price: '22.95',
        currency: 'USD',
        availability: false,
        sourceLastUpdated: new Date('2026-02-28T12:00:00.000Z'),
      },
    ]);
  });

  it('normalizes provider C payloads and tolerates invalid timestamps', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [
        {
          productId: 'prov-c-event-driven-systems',
          productName: 'Event-Driven Systems',
          desc: 'Digital course on event sourcing and asynchronous workflows.',
          priceInCents: 7400,
          currencyCode: 'usd',
          isAvailable: 0,
          last_updated_epoch: Number.NaN,
        },
      ],
    } as Response);

    await expect(providerCAdapter.fetchProducts()).resolves.toEqual([
      {
        providerName: ProviderName.PROVIDER_C,
        externalId: 'prov-c-event-driven-systems',
        canonicalKey: 'event-driven-systems',
        name: 'Event-Driven Systems',
        description: 'Digital course on event sourcing and asynchronous workflows.',
        price: '74.00',
        currency: 'USD',
        availability: false,
        sourceLastUpdated: null,
      },
    ]);
  });

  it('throws immediately for non-retryable upstream responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
    } as Response);

    await expect(providerAAdapter.fetchProducts()).rejects.toThrow(
      `${ProviderName.PROVIDER_A} request failed with status 400`,
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
