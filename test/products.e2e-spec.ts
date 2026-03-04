import { ChangeType, Currency } from '.prisma/client';
import { API_KEY_HEADER } from '@core/constants';
import { HttpExceptionFilter } from '@core/filters';
import { ApiKeyGuard } from '@core/guards';
import { ProviderName } from '@core/enums';
import { PrismaService } from '@modules/database/prisma.service';
import { ProductsController } from '@modules/products/products.controller';
import { ProductsService } from '@modules/products/products.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/client';
import type { PinoLogger } from 'nestjs-pino';
import request from 'supertest';
import { createMockProductsPrismaService } from './helpers/products-prisma.helper';

describe('Products endpoints (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let prismaService: ReturnType<typeof createMockProductsPrismaService>;

  const API_KEY = 'test-api-key';
  const filterLogger: Pick<PinoLogger, 'warn' | 'error'> = {
    warn: jest.fn(),
    error: jest.fn(),
  };

  const listProductsFixture = [
    {
      id: 1,
      canonicalKey: 'nestjs-masterclass',
      name: 'NestJS Masterclass',
      description: 'Advanced NestJS course for backend engineers.',
      providerProducts: [
        {
          id: 11,
          externalId: 'provider-a-nestjs-masterclass',
          price: new Decimal('79.99'),
          currency: Currency.USD,
          availability: true,
          sourceLastUpdated: new Date('2026-03-02T10:00:00.000Z'),
          fetchedAt: new Date('2026-03-02T10:00:05.000Z'),
          isStale: false,
          provider: {
            name: ProviderName.PROVIDER_A,
          },
        },
      ],
    },
  ];

  const productDetailFixture = {
    id: 1,
    canonicalKey: 'nestjs-masterclass',
    name: 'NestJS Masterclass',
    description: 'Advanced NestJS course for backend engineers.',
    createdAt: new Date('2026-03-02T09:00:00.000Z'),
    updatedAt: new Date('2026-03-02T10:00:00.000Z'),
    providerProducts: [
      {
        id: 11,
        externalId: 'provider-a-nestjs-masterclass',
        price: new Decimal('79.99'),
        currency: Currency.USD,
        availability: true,
        sourceLastUpdated: new Date('2026-03-02T10:00:00.000Z'),
        fetchedAt: new Date('2026-03-02T10:00:05.000Z'),
        isStale: false,
        provider: {
          name: ProviderName.PROVIDER_A,
        },
        history: [
          {
            id: 101,
            price: new Decimal('79.99'),
            oldPrice: new Decimal('69.99'),
            currency: Currency.USD,
            availability: true,
            oldAvailability: true,
            changeType: ChangeType.PRICE_CHANGE,
            changedAt: new Date('2026-03-02T10:05:00.000Z'),
          },
        ],
      },
    ],
  };

  const changesFixture = [
    {
      id: 201,
      price: new Decimal('79.99'),
      oldPrice: new Decimal('69.99'),
      currency: Currency.USD,
      availability: true,
      oldAvailability: true,
      changeType: ChangeType.PRICE_CHANGE,
      changedAt: new Date('2026-03-02T10:05:00.000Z'),
      providerProduct: {
        externalId: 'provider-a-nestjs-masterclass',
        provider: {
          name: ProviderName.PROVIDER_A,
        },
        product: {
          id: 1,
          name: 'NestJS Masterclass',
          canonicalKey: 'nestjs-masterclass',
        },
      },
    },
  ];

  beforeAll(async () => {
    prismaService = createMockProductsPrismaService();

    moduleFixture = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        mockConfigProvider(),
        ApiKeyGuard,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        stopAtFirstError: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalGuards(moduleFixture.get(ApiKeyGuard));
    app.useGlobalFilters(new HttpExceptionFilter(filterLogger as PinoLogger));
    app.setGlobalPrefix('api/v1');

    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    prismaService.product.count.mockResolvedValue(listProductsFixture.length);
    prismaService.product.findMany.mockResolvedValue(listProductsFixture);
    prismaService.product.findUnique.mockResolvedValue(productDetailFixture);
    prismaService.providerProductHistory.count.mockResolvedValue(changesFixture.length);
    prismaService.providerProductHistory.findMany.mockResolvedValue(changesFixture);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
    await moduleFixture.close();
  });

  it('rejects GET /api/v1/products without x-api-key', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/products');

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 401,
        message: 'Unauthorized request.',
        error: 'Unauthorized',
        timestamp: expect.any(String),
      }),
    );
  });

  it('rejects GET /api/v1/products with an invalid x-api-key', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/products')
      .set(API_KEY_HEADER, 'wrong-key');

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 401,
        message: 'Unauthorized request.',
        error: 'Unauthorized',
        timestamp: expect.any(String),
      }),
    );
  });

  it('returns paginated products with wrapped data and meta', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/products')
      .set(API_KEY_HEADER, API_KEY);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [
        {
          id: 1,
          canonicalKey: 'nestjs-masterclass',
          name: 'NestJS Masterclass',
          description: 'Advanced NestJS course for backend engineers.',
          offers: [
            {
              id: 11,
              externalId: 'provider-a-nestjs-masterclass',
              providerName: ProviderName.PROVIDER_A,
              price: 79.99,
              currency: Currency.USD,
              availability: true,
              sourceLastUpdated: '2026-03-02T10:00:00.000Z',
              fetchedAt: '2026-03-02T10:00:05.000Z',
              isStale: false,
            },
          ],
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
      },
    });
    expect(prismaService.product.count).toHaveBeenCalledWith({ where: {} });
    expect(prismaService.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' },
      }),
    );
  });

  it('applies the name filter to the product where clause', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/products')
      .query({ name: 'NestJS' })
      .set(API_KEY_HEADER, API_KEY);

    expect(response.status).toBe(200);
    expect(prismaService.product.count).toHaveBeenCalledWith({
      where: {
        name: {
          contains: 'NestJS',
          mode: 'insensitive',
        },
      },
    });
    expect(prismaService.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          name: {
            contains: 'NestJS',
            mode: 'insensitive',
          },
        },
      }),
    );
  });

  it('applies the availability filter to both product and offer clauses', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/products')
      .query({ availability: true })
      .set(API_KEY_HEADER, API_KEY);

    expect(response.status).toBe(200);
    expect(prismaService.product.count).toHaveBeenCalledWith({
      where: {
        providerProducts: {
          some: {
            availability: true,
          },
        },
      },
    });
    expect(prismaService.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          providerProducts: {
            some: {
              availability: true,
            },
          },
        },
        select: expect.objectContaining({
          providerProducts: expect.objectContaining({
            where: {
              availability: true,
            },
          }),
        }),
      }),
    );
  });

  it('rejects invalid pagination query params for GET /api/v1/products', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/products')
      .query({ limit: 999 })
      .set(API_KEY_HEADER, API_KEY);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 400,
        message: ['limit must not be greater than 100'],
        error: 'Bad Request',
        timestamp: expect.any(String),
      }),
    );
  });

  it('returns product detail with offers and recent history', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/products/1')
      .set(API_KEY_HEADER, API_KEY);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        id: 1,
        canonicalKey: 'nestjs-masterclass',
        name: 'NestJS Masterclass',
        description: 'Advanced NestJS course for backend engineers.',
        createdAt: '2026-03-02T09:00:00.000Z',
        updatedAt: '2026-03-02T10:00:00.000Z',
        offers: [
          {
            id: 11,
            externalId: 'provider-a-nestjs-masterclass',
            providerName: ProviderName.PROVIDER_A,
            price: 79.99,
            currency: Currency.USD,
            availability: true,
            sourceLastUpdated: '2026-03-02T10:00:00.000Z',
            fetchedAt: '2026-03-02T10:00:05.000Z',
            isStale: false,
            history: [
              {
                id: 101,
                price: 79.99,
                oldPrice: 69.99,
                currency: Currency.USD,
                availability: true,
                oldAvailability: true,
                changeType: ChangeType.PRICE_CHANGE,
                changedAt: '2026-03-02T10:05:00.000Z',
              },
            ],
          },
        ],
      },
    });
    expect(prismaService.product.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: expect.any(Object),
    });
  });

  it('returns 404 when GET /api/v1/products/:id does not exist', async () => {
    prismaService.product.findUnique.mockResolvedValueOnce(null);

    const response = await request(app.getHttpServer())
      .get('/api/v1/products/999')
      .set(API_KEY_HEADER, API_KEY);

    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 404,
        message: 'Product 999 was not found',
        error: 'Not Found',
        timestamp: expect.any(String),
      }),
    );
  });

  it('rejects non-numeric product ids', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/products/not-a-number')
      .set(API_KEY_HEADER, API_KEY);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 400,
        message: 'Validation failed (numeric string is expected)',
        error: 'Bad Request',
        timestamp: expect.any(String),
      }),
    );
  });

  it('returns paginated recent changes with wrapped data and meta', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/products/changes')
      .set(API_KEY_HEADER, API_KEY);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [
        {
          id: 201,
          productId: 1,
          productName: 'NestJS Masterclass',
          canonicalKey: 'nestjs-masterclass',
          providerName: ProviderName.PROVIDER_A,
          externalId: 'provider-a-nestjs-masterclass',
          price: 79.99,
          oldPrice: 69.99,
          currency: Currency.USD,
          availability: true,
          oldAvailability: true,
          changeType: ChangeType.PRICE_CHANGE,
          changedAt: '2026-03-02T10:05:00.000Z',
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
      },
    });
    expect(prismaService.providerProductHistory.count).toHaveBeenCalledWith({
      where: {
        changedAt: {
          gte: expect.any(Date),
        },
        changeType: {
          not: ChangeType.INITIAL,
        },
      },
    });
  });

  it('accepts the minutes query param for GET /api/v1/products/changes', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/products/changes')
      .query({ minutes: 15 })
      .set(API_KEY_HEADER, API_KEY);

    expect(response.status).toBe(200);

    const countArgs = prismaService.providerProductHistory.count.mock.calls[0][0];
    expect(countArgs.where.changeType).toEqual({ not: ChangeType.INITIAL });
    expect(countArgs.where.changedAt.gte).toBeInstanceOf(Date);
  });

  it('accepts the since query param for GET /api/v1/products/changes', async () => {
    const since = '2026-03-01T00:00:00.000Z';

    const response = await request(app.getHttpServer())
      .get('/api/v1/products/changes')
      .query({ since })
      .set(API_KEY_HEADER, API_KEY);

    expect(response.status).toBe(200);
    expect(prismaService.providerProductHistory.count).toHaveBeenCalledWith({
      where: {
        changedAt: {
          gte: new Date(since),
        },
        changeType: {
          not: ChangeType.INITIAL,
        },
      },
    });
  });

  it('rejects invalid minutes values for GET /api/v1/products/changes', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/products/changes')
      .query({ minutes: -5 })
      .set(API_KEY_HEADER, API_KEY);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 400,
        message: ['minutes must not be less than 1'],
        error: 'Bad Request',
        timestamp: expect.any(String),
      }),
    );
  });
});
