import { ChangeType, Currency, Prisma } from '.prisma/client';
import { ProviderName } from '@core/enums';
import { PrismaService } from '@modules/database/prisma.service';
import type { NormalizedProviderProduct } from '@modules/providers/interfaces';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import {
  createMockProductsPrismaService,
  createMockProductsPrismaTransactionClient,
  type MockProductsPrismaService,
  type MockProductsPrismaTransactionClient,
} from '../../../../test/helpers/products-prisma.helper';
import { AggregationEvent } from '../events';
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
  let eventEmitter: {
    emit: jest.Mock;
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
    eventEmitter = {
      emit: jest.fn(),
    };

    prismaService.$transaction.mockImplementation(async (arg: unknown) => {
      if (typeof arg === 'function') {
        return (arg as (client: typeof tx) => unknown)(tx);
      }

      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }

      throw new Error('Unsupported transaction payload in test');
    });

    module = await Test.createTestingModule({
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
        {
          provide: EventEmitter2,
          useValue: eventEmitter,
        },
      ],
    }).compile();

    service = module.get<AggregationPersistenceService>(AggregationPersistenceService);
  });

  beforeEach(() => {
    prismaService.provider.upsert.mockReset();
    prismaService.provider.findMany.mockReset();
    prismaService.product.upsert.mockReset();
    prismaService.product.findMany.mockReset();
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
    prismaService.provider.findMany.mockResolvedValue([
      {
        id: 1,
        name: normalizedItem.providerName,
        baseUrl: normalizedItem.providerBaseUrl,
      },
    ]);
    prismaService.product.upsert.mockResolvedValue({
      id: 10,
      canonicalKey: normalizedItem.canonicalKey,
      name: normalizedItem.name,
      description: normalizedItem.description,
    });
    prismaService.product.findMany.mockResolvedValue([
      {
        id: 10,
        canonicalKey: normalizedItem.canonicalKey,
        name: normalizedItem.name,
        description: normalizedItem.description,
      },
    ]);
    prismaService.providerProduct.updateMany.mockResolvedValue({ count: 0 });
  });

  afterEach(() => {
    logger.error.mockReset();
    logger.warn.mockReset();
    eventEmitter.emit.mockReset();
  });

  afterAll(async () => {
    await module.close();
  });

  it('creates a provider product and an INITIAL history record for new items', async () => {
    tx.providerProduct.findUnique.mockResolvedValue(null);
    tx.providerProduct.create.mockResolvedValue({ id: 100 });

    await service.persistBatch([normalizedItem]);

    expect(prismaService.provider.upsert).toHaveBeenCalledWith({
      where: { name: normalizedItem.providerName },
      update: { baseUrl: normalizedItem.providerBaseUrl },
      create: {
        name: normalizedItem.providerName,
        baseUrl: normalizedItem.providerBaseUrl,
      },
    });
    expect(prismaService.product.upsert).toHaveBeenCalledWith({
      where: { canonicalKey: normalizedItem.canonicalKey },
      update: {},
      create: {
        canonicalKey: normalizedItem.canonicalKey,
        name: normalizedItem.name,
        description: normalizedItem.description,
      },
    });
    expect(tx.providerProduct.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          providerId: 1,
          productId: 10,
          externalId: normalizedItem.externalId,
          price: new Prisma.Decimal('79.99'),
          currency: Currency.USD,
          availability: true,
          isStale: false,
        }),
      }),
    );
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
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('stores history before updating an existing provider product when price or availability changes', async () => {
    tx.providerProduct.findUnique.mockResolvedValue({
      id: 100,
      price: new Prisma.Decimal('59.99'),
      availability: false,
    });

    await service.persistBatch([normalizedItem]);

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
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      AggregationEvent.PRODUCT_CHANGE,
      expect.objectContaining({
        productId: 10,
        providerName: normalizedItem.providerName,
        externalId: normalizedItem.externalId,
        price: normalizedItem.price,
        oldPrice: '59.99',
        availability: true,
        oldAvailability: false,
        changeType: ChangeType.BOTH,
      }),
    );
  });

  it('stores a PRICE_CHANGE history entry when only the price changes', async () => {
    tx.providerProduct.findUnique.mockResolvedValue({
      id: 100,
      price: new Prisma.Decimal('59.99'),
      availability: true,
    });

    await service.persistBatch([normalizedItem]);

    expect(tx.providerProductHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          providerProductId: 100,
          changeType: ChangeType.PRICE_CHANGE,
          oldAvailability: true,
        }),
      }),
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      AggregationEvent.PRODUCT_CHANGE,
      expect.objectContaining({
        changeType: ChangeType.PRICE_CHANGE,
      }),
    );
  });

  it('stores an AVAILABILITY_CHANGE history entry when only availability changes', async () => {
    tx.providerProduct.findUnique.mockResolvedValue({
      id: 100,
      price: new Prisma.Decimal('79.99'),
      availability: false,
    });

    await service.persistBatch([normalizedItem]);

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
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      AggregationEvent.PRODUCT_CHANGE,
      expect.objectContaining({
        changeType: ChangeType.AVAILABILITY_CHANGE,
      }),
    );
  });

  it('does not emit a product change event when the current values are unchanged', async () => {
    tx.providerProduct.findUnique.mockResolvedValue({
      id: 100,
      price: new Prisma.Decimal('79.99'),
      availability: true,
    });

    await service.persistBatch([normalizedItem]);

    expect(tx.providerProductHistory.create).not.toHaveBeenCalled();
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
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('marks stale provider products using fetchedAt', async () => {
    prismaService.providerProduct.updateMany.mockResolvedValue({ count: 3 });

    await expect(service.markStaleProducts(90000)).resolves.toBe(3);
    expect(prismaService.providerProduct.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          fetchedAt: expect.objectContaining({ lt: expect.any(Date) }),
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

  it('logs invalid prices and skips persistence for those items', async () => {
    const invalidPriceItem: NormalizedProviderProduct = {
      ...normalizedItem,
      price: '0',
    };

    await expect(service.persistBatch([invalidPriceItem])).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        providerName: normalizedItem.providerName,
        externalId: normalizedItem.externalId,
        canonicalKey: normalizedItem.canonicalKey,
        err: expect.any(Error),
      }),
      'Failed to persist normalized provider product',
    );
    expect(tx.providerProduct.create).not.toHaveBeenCalled();
    expect(tx.providerProduct.update).not.toHaveBeenCalled();
    expect(tx.providerProductHistory.create).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });
});
