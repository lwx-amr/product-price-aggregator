import type { Environment } from '@config';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AGGREGATION_INTERVAL_NAME } from '../constants/';
import { AggregationService } from './aggregation.service';

@Injectable()
export class AggregationSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly fetchIntervalMs: number;
  private isRunning = false;

  constructor(
    private readonly aggregationService: AggregationService,
    private readonly configService: ConfigService<Environment, true>,
    private readonly schedulerRegistry: SchedulerRegistry,
    @InjectPinoLogger(AggregationSchedulerService.name)
    private readonly logger: PinoLogger,
  ) {
    this.fetchIntervalMs = this.configService.get('FETCH_INTERVAL_MS', { infer: true });
  }

  async onModuleInit(): Promise<void> {
    await this.runCycle();

    const interval = setInterval(() => {
      void this.runCycle();
    }, this.fetchIntervalMs);

    this.schedulerRegistry.addInterval(AGGREGATION_INTERVAL_NAME, interval);
    this.logger.info({ fetchIntervalMs: this.fetchIntervalMs }, 'Aggregation scheduler started');
  }

  onModuleDestroy(): void {
    try {
      this.schedulerRegistry.deleteInterval(AGGREGATION_INTERVAL_NAME);
    } catch {
      return;
    }
  }

  async runCycle(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Skipping aggregation cycle because the previous one is still running');
      return;
    }

    this.isRunning = true;

    try {
      await this.aggregationService.runAggregationCycle();
    } finally {
      this.isRunning = false;
    }
  }
}
