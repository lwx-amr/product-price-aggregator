import { ChangeType, Currency, Prisma } from '.prisma/client';
import { PrismaService } from '@modules/database/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  createMockProductsPrismaService,
  type MockProductsPrismaService,
} from '../../../test/helpers/products-prisma.helper';
import { GetChangesQueryDto, GetProductsQueryDto } from './dto';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let module: TestingModule;
  let service: ProductsService;
  let prismaService: MockProductsPrismaService;

  beforeAll(async () => {
    prismaService = createMockProductsPrismaService();

    const moduleBuilder = Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaService);

    module = await moduleBuilder.compile();
    service = module.get<ProductsService>(ProductsService);
  });

  beforeEach(() => {
    prismaService.product.count.mockReset();
    prismaService.product.findMany.mockReset();
    prismaService.product.findUnique.mockReset();
    prismaService.providerProductHistory.count.mockReset();
    prismaService.providerProductHistory.findMany.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  it('returns paginated products with only matching offers', async () => {
    const query = new GetProductsQueryDto();
    query.provider = undefined;
    query.availability = true;
    query.minPrice = 10;
    query.maxPrice = 100;

    prismaService.product.count.mockResolvedValue(1);
    prismaService.product.findMany.mockResolvedValue([
      {
        id: 1,
        canonicalKey: 'nestjs-masterclass',
        name: 'NestJS Masterclass',
        description: 'Advanced NestJS course.',
        providerProducts: [
          {
            id: 10,
            externalId: 'provider-a-nestjs-masterclass',
            price: new Prisma.Decimal('79.99'),
            currency: Currency.USD,
            availability: true,
            sourceLastUpdated: new Date('2026-03-02T10:00:00.000Z'),
            fetchedAt: new Date('2026-03-02T10:00:05.000Z'),
            isStale: false,
            provider: {
              name: 'provider-a',
            },
            history: [],
          },
        ],
      },
    ]);

    const result = await service.findAll(query);

    expect(prismaService.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          providerProducts: {
            some: {
              price: {
                gte: new Prisma.Decimal(10),
                lte: new Prisma.Decimal(100),
              },
              availability: true,
            },
          },
        }),
        select: expect.objectContaining({
          providerProducts: expect.objectContaining({
            where: {
              price: {
                gte: new Prisma.Decimal(10),
                lte: new Prisma.Decimal(100),
              },
              availability: true,
            },
          }),
        }),
      }),
    );
    expect(result.items[0]?.providerProducts).toHaveLength(1);
    expect(result.meta).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
      hasNext: false,
    });
  });

  it('throws NotFoundException when the product does not exist', async () => {
    prismaService.product.findUnique.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('returns recent non-initial changes with pagination metadata', async () => {
    const query = new GetChangesQueryDto();
    query.minutes = 30;

    prismaService.providerProductHistory.count.mockResolvedValue(1);
    prismaService.providerProductHistory.findMany.mockResolvedValue([
      {
        id: 101,
        price: new Prisma.Decimal('79.99'),
        oldPrice: new Prisma.Decimal('59.99'),
        currency: Currency.USD,
        availability: true,
        oldAvailability: false,
        changeType: ChangeType.BOTH,
        changedAt: new Date('2026-03-02T10:05:00.000Z'),
        providerProduct: {
          externalId: 'provider-a-nestjs-masterclass',
          provider: {
            name: 'provider-a',
          },
          product: {
            id: 1,
            name: 'NestJS Masterclass',
            canonicalKey: 'nestjs-masterclass',
          },
        },
      },
    ]);

    const result = await service.findChanges(query);

    expect(prismaService.providerProductHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          changeType: {
            not: ChangeType.INITIAL,
          },
        }),
      }),
    );
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        providerProduct: expect.objectContaining({
          product: expect.objectContaining({
            id: 1,
          }),
          provider: expect.objectContaining({
            name: 'provider-a',
          }),
        }),
        oldAvailability: false,
      }),
    );
  });
});
