import { ChangeType, Currency } from '.prisma/client';
import { AggregationEvent } from '@modules/aggregation/events';
import { Test, TestingModule } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { firstValueFrom } from 'rxjs';
import { StreamsService } from './streams.service';

describe('StreamEventsService', () => {
  let module: TestingModule;
  let service: StreamsService;
  let logger: {
    debug: jest.Mock;
  };

  beforeAll(async () => {
    logger = {
      debug: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        StreamsService,
        {
          provide: getLoggerToken(StreamsService.name),
          useValue: logger,
        },
      ],
    }).compile();

    service = module.get<StreamsService>(StreamsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    logger.debug.mockReset();
  });

  afterAll(async () => {
    await module.close();
  });

  it('pushes incoming product change events into the product stream', async () => {
    const eventPromise = firstValueFrom(service.getProductChangesStream());

    service.handleProductChange({
      productId: 1,
      productName: 'NestJS Masterclass',
      canonicalKey: 'nestjs-masterclass',
      providerName: 'provider-a',
      externalId: 'provider-a-nestjs-masterclass',
      price: '79.99',
      oldPrice: '59.99',
      currency: Currency.USD,
      availability: true,
      oldAvailability: false,
      changeType: ChangeType.BOTH,
      changedAt: new Date('2026-03-03T10:00:00.000Z'),
    });

    await expect(eventPromise).resolves.toEqual(
      expect.objectContaining({
        productId: 1,
        providerName: 'provider-a',
        changeType: ChangeType.BOTH,
      }),
    );
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: AggregationEvent.PRODUCT_CHANGE,
        productId: 1,
        providerName: 'provider-a',
        changeType: ChangeType.BOTH,
      }),
      'Broadcasting stream event',
    );
  });
});
