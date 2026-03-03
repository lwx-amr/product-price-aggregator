import { ProviderName } from '@core/enums';
import { Test, TestingModule } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { SimulatedProviderRegistryService } from './simulated-provider-registry.service';

describe('SimulatedProviderRegistryService', () => {
  let service: SimulatedProviderRegistryService;
  let module: TestingModule;
  let logger: {
    info: jest.Mock;
  };

  beforeAll(async () => {
    logger = {
      info: jest.fn(),
    };
    module = await Test.createTestingModule({
      providers: [
        SimulatedProviderRegistryService,
        mockConfigProvider(),
        {
          provide: getLoggerToken(SimulatedProviderRegistryService.name),
          useValue: logger,
        },
      ],
    }).compile();

    service = module.get(SimulatedProviderRegistryService);
  });

  afterEach(async () => {
    service?.onModuleDestroy();
    logger.info.mockReset();
  });

  afterAll(async () => {
    await module?.close();
  });

  it('returns a defensive snapshot for each provider', async () => {
    service.onModuleInit();

    const snapshot = service.getProductsSnapshot(ProviderName.PROVIDER_A);
    snapshot[0]!.price = 999;

    const nextSnapshot = service.getProductsSnapshot(ProviderName.PROVIDER_A);

    expect(nextSnapshot[0]!.price).not.toBe(999);
  });

  it('mutates price and availability while updating the timestamp only when values change', async () => {
    const baselineTimestamp = 1_700_000_000_000;
    const changedTimestamp = baselineTimestamp + 1_000;

    jest.spyOn(Date, 'now').mockReturnValue(changedTimestamp);
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0);

    const result = service['mutateProduct']({
      id: 'prov-a-nestjs-masterclass',
      name: 'NestJS Masterclass',
      description: 'Advanced NestJS course for backend engineers.',
      price: 100,
      currency: 'USD',
      available: true,
      lastUpdated: baselineTimestamp,
    });

    expect(result.price).toBe(95);
    expect(result.available).toBe(false);
    expect(result.lastUpdated).toBe(changedTimestamp);
    expect(randomSpy).toHaveBeenCalledTimes(2);
  });

  it('keeps the original timestamp when a mutation results in no observable change', async () => {
    const originalProduct = {
      id: 'prov-a-prisma-query-kit',
      name: 'Prisma Query Kit',
      description: 'Template pack with reusable Prisma query patterns.',
      price: 19,
      currency: 'USD',
      available: false,
      lastUpdated: 1_700_000_000_000,
    };

    jest.spyOn(Math, 'random').mockReturnValueOnce(0.5).mockReturnValueOnce(0.99);

    const result = service['mutateProduct'](originalProduct);

    expect(result).toBe(originalProduct);
  });
});
