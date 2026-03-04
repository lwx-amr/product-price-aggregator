import { Test, TestingModule } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { firstValueFrom, Subject } from 'rxjs';
import { StreamsController } from './streams.controller';
import { StreamsService } from './streams.service';

describe('StreamsController', () => {
  let controller: StreamsController;
  let module: TestingModule;
  let streamEventsService: {
    getProductChangesStream: jest.Mock;
  };
  let logger: {
    info: jest.Mock;
  };

  beforeAll(async () => {
    streamEventsService = {
      getProductChangesStream: jest.fn(),
    };
    logger = {
      info: jest.fn(),
    };

    module = await Test.createTestingModule({
      controllers: [StreamsController],
      providers: [
        {
          provide: StreamsService,
          useValue: streamEventsService,
        },
        {
          provide: getLoggerToken(StreamsController.name),
          useValue: logger,
        },
      ],
    }).compile();

    controller = module.get<StreamsController>(StreamsController);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    streamEventsService.getProductChangesStream.mockReset();
    logger.info.mockReset();
  });

  afterAll(async () => {
    await module.close();
  });

  it('returns an observable that emits mapped product change events', async () => {
    const changes$ = new Subject<{
      productId: number;
      productName: string;
      canonicalKey: string;
      providerName: string;
      externalId: string;
      price: string;
      oldPrice: string;
      currency: string;
      availability: boolean;
      oldAvailability: boolean;
      changeType: string;
      changedAt: Date;
    }>();

    streamEventsService.getProductChangesStream.mockReturnValue(changes$.asObservable());

    const stream$ = controller.products();
    const eventPromise = firstValueFrom(stream$);

    changes$.next({
      productId: 1,
      productName: 'NestJS Masterclass',
      canonicalKey: 'nestjs-masterclass',
      providerName: 'provider-a',
      externalId: 'provider-a-nestjs-masterclass',
      price: '79.99',
      oldPrice: '59.99',
      currency: 'USD',
      availability: true,
      oldAvailability: false,
      changeType: 'BOTH',
      changedAt: new Date('2026-03-03T10:00:00.000Z'),
    });

    await expect(eventPromise).resolves.toEqual({
      type: 'product-change',
      data: expect.objectContaining({
        productId: 1,
        providerName: 'provider-a',
      }),
    });
    expect(logger.info).toHaveBeenCalledWith({ stream: 'products' }, 'Opened SSE stream');
  });
});
