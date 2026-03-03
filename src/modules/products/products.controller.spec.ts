import { ChangeType, Currency, Prisma } from '.prisma/client';
import { PrismaService } from '@modules/database/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import {
  createMockProductsPrismaService,
  type MockProductsPrismaService,
} from '../../../test/helpers/products-prisma.helper';
import {
  ChangeResponseDto,
  GetChangesQueryDto,
  GetProductsQueryDto,
  ProductResponseDto,
} from './dto';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let module: TestingModule;
  let productsService: ProductsService;
  let prismaService: MockProductsPrismaService;

  beforeAll(async () => {
    prismaService = createMockProductsPrismaService();

    const moduleBuilder = Test.createTestingModule({
      controllers: [ProductsController],
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

    controller = module.get<ProductsController>(ProductsController);
    productsService = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    prismaService.product.count.mockReset();
    prismaService.product.findMany.mockReset();
    prismaService.product.findUnique.mockReset();
    prismaService.providerProductHistory.count.mockReset();
    prismaService.providerProductHistory.findMany.mockReset();
  });

  afterAll(async () => {
    await module.close();
  });

  it('wraps product list responses with data and meta', async () => {
    const query = new GetProductsQueryDto();
    const items = [
      {
        id: 1,
        canonicalKey: 'nestjs-masterclass',
        name: 'NestJS Masterclass',
        description: 'Advanced NestJS course.',
        providerProducts: [],
      },
    ];
    const meta = {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
      hasNext: false,
    };

    jest.spyOn(productsService, 'findAll').mockResolvedValue({ items, meta });

    await expect(controller.findAll(query)).resolves.toEqual({
      data: [
        new ProductResponseDto({
          id: 1,
          canonicalKey: 'nestjs-masterclass',
          name: 'NestJS Masterclass',
          description: 'Advanced NestJS course.',
          providerProducts: [],
        }),
      ],
      meta,
    });
  });

  it('wraps detail responses with data', async () => {
    const product = {
      id: 1,
      canonicalKey: 'nestjs-masterclass',
      name: 'NestJS Masterclass',
      description: 'Advanced NestJS course.',
      createdAt: new Date('2026-03-02T09:00:00.000Z'),
      updatedAt: new Date('2026-03-02T10:00:00.000Z'),
      providerProducts: [],
    };

    jest.spyOn(productsService, 'findOne').mockResolvedValue(product);

    await expect(controller.findOne(1)).resolves.toEqual({
      data: {
        id: 1,
        canonicalKey: 'nestjs-masterclass',
        name: 'NestJS Masterclass',
        description: 'Advanced NestJS course.',
        createdAt: new Date('2026-03-02T09:00:00.000Z'),
        updatedAt: new Date('2026-03-02T10:00:00.000Z'),
        offers: [],
      },
    });
  });

  it('wraps changes responses with data and meta', async () => {
    const query = new GetChangesQueryDto();
    const items = [
      {
        id: 101,
        price: new Prisma.Decimal('79.99'),
        oldPrice: null,
        currency: Currency.USD,
        availability: true,
        oldAvailability: null,
        changeType: ChangeType.PRICE_CHANGE,
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
    ];
    const meta = {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
      hasNext: false,
    };

    jest.spyOn(productsService, 'findChanges').mockResolvedValue({ items, meta });

    await expect(controller.getChanges(query)).resolves.toEqual({
      data: [
        new ChangeResponseDto({
          id: 101,
          price: new Prisma.Decimal('79.99'),
          oldPrice: null,
          currency: Currency.USD,
          availability: true,
          oldAvailability: null,
          changeType: ChangeType.PRICE_CHANGE,
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
        }),
      ],
      meta,
    });
  });
});
