import { SchedulerRegistry } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { AGGREGATION_INTERVAL_NAME } from '../constants';
import { AggregationSchedulerService } from './aggregation-scheduler.service';
import { AggregationService } from './aggregation.service';

describe('AggregationSchedulerService', () => {
  let module: TestingModule;
  let service: AggregationSchedulerService;
  let aggregationService: AggregationService;
  let schedulerRegistry: SchedulerRegistry;
  let logger: {
    info: jest.Mock;
    warn: jest.Mock;
  };

  beforeAll(async () => {
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
    };
    const moduleBuilder = Test.createTestingModule({
      providers: [
        AggregationSchedulerService,
        mockConfigProvider(),
        AggregationService,
        SchedulerRegistry,
        {
          provide: getLoggerToken(AggregationSchedulerService.name),
          useValue: logger,
        },
      ],
    })
      .overrideProvider(AggregationService)
      .useValue({
        runAggregationCycle: jest.fn(),
      })
      .overrideProvider(SchedulerRegistry)
      .useValue({
        addInterval: jest.fn(),
        deleteInterval: jest.fn(),
      });

    module = await moduleBuilder.compile();

    service = module.get<AggregationSchedulerService>(AggregationSchedulerService);
    aggregationService = module.get<AggregationService>(AggregationService);
    schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry);
  });

  beforeEach(() => {
    jest.useFakeTimers();
    logger.info.mockReset();
    logger.warn.mockReset();
    jest.spyOn(aggregationService, 'runAggregationCycle').mockReset().mockResolvedValue(undefined);
    jest.spyOn(schedulerRegistry, 'addInterval').mockReset();
    jest.spyOn(schedulerRegistry, 'deleteInterval').mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(async () => {
    await module.close();
  });

  it('runs one cycle immediately on module init and registers the configured interval', async () => {
    await service.onModuleInit();

    expect(aggregationService.runAggregationCycle).toHaveBeenCalledTimes(1);
    expect(schedulerRegistry.addInterval).toHaveBeenCalledTimes(1);
    expect(schedulerRegistry.addInterval).toHaveBeenCalledWith(
      AGGREGATION_INTERVAL_NAME,
      expect.any(Object),
    );
    expect(logger.info).toHaveBeenCalledWith(
      { fetchIntervalMs: 30000 },
      'Aggregation scheduler started',
    );
  });

  it('runs the scheduled interval callback', async () => {
    await service.onModuleInit();

    jest.advanceTimersByTime(30000);
    await Promise.resolve();

    expect(aggregationService.runAggregationCycle).toHaveBeenCalledTimes(2);
  });

  it('skips a cycle when the previous one is still running', async () => {
    let resolveCycle: (() => void) | undefined;
    jest.spyOn(aggregationService, 'runAggregationCycle').mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveCycle = resolve;
        }) as any,
    );

    const firstRun = service.runCycle();
    await Promise.resolve();

    await service.runCycle();

    expect(aggregationService.runAggregationCycle).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      'Skipping aggregation cycle because the previous one is still running',
    );

    resolveCycle?.();
    await firstRun;
  });

  it('deletes the registered interval on module destroy', () => {
    service.onModuleDestroy();

    expect(schedulerRegistry.deleteInterval).toHaveBeenCalledWith(AGGREGATION_INTERVAL_NAME);
  });

  it('ignores missing intervals on module destroy', () => {
    jest.spyOn(schedulerRegistry, 'deleteInterval').mockImplementation(() => {
      throw new Error('missing interval');
    });

    expect(() => service.onModuleDestroy()).not.toThrow();
  });
});
