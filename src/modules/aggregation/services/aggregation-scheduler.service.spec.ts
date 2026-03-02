import { Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';
import { AGGREGATION_INTERVAL_NAME } from '../constants';
import { AggregationSchedulerService } from './aggregation-scheduler.service';
import { AggregationService } from './aggregation.service';

describe('AggregationSchedulerService', () => {
  let module: TestingModule;
  let service: AggregationSchedulerService;
  let aggregationService: AggregationService;
  let schedulerRegistry: SchedulerRegistry;

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      providers: [
        AggregationSchedulerService,
        mockConfigProvider(),
        AggregationService,
        SchedulerRegistry,
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
    jest.spyOn(aggregationService, 'runAggregationCycle').mockReset().mockResolvedValue(undefined);
    jest.spyOn(schedulerRegistry, 'addInterval').mockReset();
    jest.spyOn(schedulerRegistry, 'deleteInterval').mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
  });

  it('skips a cycle when the previous one is still running', async () => {
    const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    let resolveCycle: (() => void) | undefined;
    jest.spyOn(aggregationService, 'runAggregationCycle').mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveCycle = resolve;
        }),
    );

    const firstRun = service.runCycle();
    await Promise.resolve();

    await service.runCycle();

    expect(aggregationService.runAggregationCycle).toHaveBeenCalledTimes(1);
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      'Skipping aggregation cycle because the previous one is still running.',
    );

    resolveCycle?.();
    await firstRun;
  });

  it('deletes the registered interval on module destroy', () => {
    service.onModuleDestroy();

    expect(schedulerRegistry.deleteInterval).toHaveBeenCalledWith(AGGREGATION_INTERVAL_NAME);
  });
});
