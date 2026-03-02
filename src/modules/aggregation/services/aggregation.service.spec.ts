import { ProviderName, SettledStatus } from '@core/enums';
import { PROVIDER_ADAPTERS } from '@modules/providers/constants';
import type { NormalizedProviderProduct, ProviderAdapter } from '@modules/providers/interfaces';
import { Test, TestingModule } from '@nestjs/testing';
import { AggregationService } from './aggregation.service';
import { AggregationPersistenceService } from './aggregation-persistence.service';

describe('AggregationService', () => {
  let module: TestingModule;
  let service: AggregationService;
  let aggregationPersistenceService: AggregationPersistenceService;
  let providerAAdapter: ProviderAdapter;
  let providerBAdapter: ProviderAdapter;
  let providerAdapters: ProviderAdapter[];

  beforeAll(async () => {
    providerAAdapter = {
      providerName: ProviderName.PROVIDER_A,
      fetchProducts: jest.fn(),
    };
    providerBAdapter = {
      providerName: ProviderName.PROVIDER_B,
      fetchProducts: jest.fn(),
    };
    providerAdapters = [providerAAdapter, providerBAdapter];

    const moduleBuilder = Test.createTestingModule({
      providers: [
        AggregationService,
        AggregationPersistenceService,
        mockConfigProvider(),
        {
          provide: PROVIDER_ADAPTERS,
          useValue: providerAdapters,
        },
      ],
    }).overrideProvider(AggregationPersistenceService).useValue({
      persistBatch: jest.fn(),
      markStaleProducts: jest.fn(),
    });

    module = await moduleBuilder.compile();

    service = module.get<AggregationService>(AggregationService);
    aggregationPersistenceService = module.get<AggregationPersistenceService>(
      AggregationPersistenceService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest
      .spyOn(aggregationPersistenceService, 'persistBatch')
      .mockReset()
      .mockResolvedValue(undefined);
    jest
      .spyOn(aggregationPersistenceService, 'markStaleProducts')
      .mockReset()
      .mockResolvedValue(0);
    (providerAAdapter.fetchProducts as jest.Mock).mockReset();
    (providerBAdapter.fetchProducts as jest.Mock).mockReset();
  });

  afterAll(async () => {
    await module.close();
  });

  it('fetches providers concurrently, persists fulfilled items, and returns a run summary', async () => {
    const providerAItems: NormalizedProviderProduct[] = [
      {
        providerName: ProviderName.PROVIDER_A,
        providerBaseUrl: 'http://localhost:3398/api/v1/sim/providers/a/products',
        externalId: 'a-1',
        canonicalKey: 'nestjs-masterclass',
        name: 'NestJS Masterclass',
        description: 'Advanced NestJS course.',
        price: '79.99',
        currency: 'USD',
        availability: true,
        sourceLastUpdated: new Date('2026-03-02T10:00:00.000Z'),
      },
    ];

    (providerAAdapter.fetchProducts as jest.Mock).mockResolvedValue(providerAItems);
    (providerBAdapter.fetchProducts as jest.Mock).mockRejectedValue(
      new Error('provider b unavailable'),
    );
    jest.spyOn(aggregationPersistenceService, 'persistBatch').mockResolvedValue(undefined);
    jest.spyOn(aggregationPersistenceService, 'markStaleProducts').mockResolvedValue(2);

    const summary = await service.runAggregationCycle();

    expect(aggregationPersistenceService.persistBatch).toHaveBeenCalledWith(providerAItems);
    expect(aggregationPersistenceService.markStaleProducts).toHaveBeenCalledWith(90000);
    expect(summary.totalItems).toBe(1);
    expect(summary.providersOk).toBe(1);
    expect(summary.providersFailed).toBe(1);
    expect(summary.staleProductsMarked).toBe(2);
    expect(summary.providers).toEqual([
      {
        providerName: ProviderName.PROVIDER_A,
        status: SettledStatus.FULFILLED,
        itemCount: 1,
      },
      {
        providerName: ProviderName.PROVIDER_B,
        status: SettledStatus.REJECTED,
        itemCount: 0,
        errorMessage: 'provider b unavailable',
      },
    ]);
  });
});
