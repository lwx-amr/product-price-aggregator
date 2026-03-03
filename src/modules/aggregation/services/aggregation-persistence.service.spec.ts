import { ChangeType, Currency, Prisma } from '.prisma/client';
import { ProviderName } from '@core/enums';
import { PrismaService } from '@modules/database/prisma.service';
import type { NormalizedProviderProduct } from '@modules/providers/interfaces';
import { Test, TestingModule } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import {
  createMockProductsPrismaService,
  createMockProductsPrismaTransactionClient,
  type MockProductsPrismaService,
  type MockProductsPrismaTransactionClient,
} from '../../../../test/helpers/products-prisma.helper';
import { AggregationPersistenceService } from './aggregation-persistence.service';

describe('AggregationPersistenceService', () => {
  let module: TestingModule;
  let service: AggregationPersistenceService;
  let prismaService: MockProductsPrismaService;
  let tx: MockProductsPrismaTransactionClient;
  let logger: {
    error: jest.Mock;
    warn: jest.Mock;
  };

  const normalizedItem: NormalizedProviderProduct = {
    providerName: ProviderName.PROVIDER_A,
    providerBaseUrl: 'http://localhost:3398/api/v1/sim/providers/a/products',
    externalId: 'provider-a-nestjs-masterclass',
    canonicalKey: 'nestjs-masterclass',
    name: 'NestJS Masterclass',
    description: 'Advanced NestJS course.',
    price: '79.99',
    currency: Currency.USD,
    availability: true,
    sourceLastUpdated: new Date('2026-03-02T10:00:00.000Z'),
  };

  beforeAll(async () => {
    tx = createMockProductsPrismaTransactionClient();
    prismaService = createMockProductsPrismaService();
    logger = {
      error: jest.fn(),
      warn: jest.fn(),
    };

    prismaService.$transaction.mockImplementation(
      async (callback: (client: typeof tx) => unknown) => callback(tx),
    );

    const moduleBuilder = Test.createTestingModule({
      providers: [
        AggregationPersistenceService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: getLoggerToken(AggregationPersistenceService.name),
          useValue: logger,
        },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaService);

    module = await moduleBuilder.compile();

    service = module.get<AggregationPersistenceService>(AggregationPersistenceService);
  });

  beforeEach(() => {
    prismaService.provider.upsert.mockReset();
    prismaService.product.upsert.mockReset();
    prismaService.providerProduct.updateMany.mockReset();
    prismaService.$transaction.mockClear();
    tx.providerProduct.findUnique.mockReset();
    tx.providerProduct.create.mockReset();
    tx.providerProduct.update.mockReset();
    tx.providerProductHistory.create.mockReset();

    prismaService.provider.upsert.mockResolvedValue({
      id: 1,
      name: normalizedItem.providerName,
      baseUrl: normalizedItem.providerBaseUrl,
    });
    prismaService.product.upsert.mockResolvedValue({
      id: 10,
      canonicalKey: normalizedItem.canonicalKey,
      name: normalizedItem.name,
      description: normalizedItem.description,
    });
    prismaService.providerProduct.updateMany.mockResolvedValue({ count: 0 });
  });

  afterEach(() => {
    logger.error.mockReset();
    logger.warn.mockReset();
  });

  afterAll(async () => {
    await module.close();
  });

  it('creates a provider product and an INITIAL history record for new items', async () => {
    tx.providerProduct.findUnique.mockResolvedValue(null);
    tx.providerProduct.create.mockResolvedValue({ id: 100 });

    await service.persistItem(normalizedItem);

    expect(prismaService.provider.upsert).toHaveBeenCalledWith({
      where: { name: normalizedItem.providerName },
      update: { baseUrl: normalizedItem.providerBaseUrl },
      create: {
        name: normalizedItem.providerName,
        baseUrl: normalizedItem.providerBaseUrl,
      },
    });
    expect(tx.providerProduct.create).toHaveBeenCalled();
    expect(tx.providerProductHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          providerProductId: 100,
          changeType: ChangeType.INITIAL,
          oldPrice: null,
          oldAvailability: null,
        }),
      }),
    );
  });

  it('stores history before updating an existing provider product when price or availability changes', async () => {
    tx.providerProduct.findUnique.mockResolvedValue({
      id: 100,
      price: new Prisma.Decimal('59.99'),
      availability: false,
    });

    await service.persistItem(normalizedItem);

    expect(tx.providerProductHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          providerProductId: 100,
          oldPrice: new Prisma.Decimal('59.99'),
          oldAvailability: false,
          changeType: ChangeType.BOTH,
        }),
      }),
    );
    expect(tx.providerProduct.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 100 },
        data: expect.objectContaining({
          price: new Prisma.Decimal('79.99'),
          currency: Currency.USD,
          availability: true,
          isStale: false,
        }),
      }),
    );
  });

  it('stores a PRICE_CHANGE history entry when only the price changes', async () => {
    tx.providerProduct.findUnique.mockResolvedValue({
      id: 100,
      price: new Prisma.Decimal('59.99'),
      availability: true,
    });

    await service.persistItem(normalizedItem);

    expect(tx.providerProductHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          providerProductId: 100,
          changeType: ChangeType.PRICE_CHANGE,
          oldAvailability: true,
        }),
      }),
    );
  });

  it('stores an AVAILABILITY_CHANGE history entry when only availability changes', async () => {
    tx.providerProduct.findUnique.mockResolvedValue({
      id: 100,
      price: new Prisma.Decimal('79.99'),
      availability: false,
    });

    await service.persistItem(normalizedItem);

    expect(tx.providerProductHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          providerProductId: 100,
          changeType: ChangeType.AVAILABILITY_CHANGE,
          oldPrice: new Prisma.Decimal('79.99'),
          oldAvailability: false,
        }),
      }),
    );
  });

  it('marks stale provider products using fetchedAt', async () => {
    prismaService.providerProduct.updateMany.mockResolvedValue({ count: 3 });

    await expect(service.markStaleProducts(90000)).resolves.toBe(3);
    expect(prismaService.providerProduct.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isStale: false,
        }),
        data: {
          isStale: true,
        },
      }),
    );
  });

  it('logs and skips invalid items without stopping the batch', async () => {
    const invalidItem: NormalizedProviderProduct = {
      ...normalizedItem,
      currency: 'SAR',
    };

    tx.providerProduct.findUnique.mockResolvedValue(null);
    tx.providerProduct.create.mockResolvedValue({ id: 100 });

    await service.persistBatch([invalidItem, normalizedItem]);

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(tx.providerProduct.create).toHaveBeenCalledTimes(1);
  });

  it('throws for invalid prices before starting persistence', async () => {
    const invalidPriceItem: NormalizedProviderProduct = {
      ...normalizedItem,
      price: '0',
    };

    await expect(service.persistItem(invalidPriceItem)).rejects.toThrow(
      `Invalid price "0" for ${normalizedItem.providerName}:${normalizedItem.externalId}`,
    );
    expect(prismaService.provider.upsert).not.toHaveBeenCalled();
    expect(prismaService.product.upsert).not.toHaveBeenCalled();
  });
});
