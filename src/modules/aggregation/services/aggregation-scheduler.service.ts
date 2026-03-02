import type { Environment } from '@config';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { AGGREGATION_INTERVAL_NAME } from '../constants/';
import { AggregationService } from './aggregation.service';

@Injectable()
export class AggregationSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AggregationSchedulerService.name);
  private readonly fetchIntervalMs: number;
  private isRunning = false;

  constructor(
    private readonly aggregationService: AggregationService,
    private readonly configService: ConfigService<Environment, true>,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.fetchIntervalMs = this.configService.get('FETCH_INTERVAL_MS', { infer: true });
  }

  async onModuleInit(): Promise<void> {
    await this.runCycle();

    const interval = setInterval(() => {
      void this.runCycle();
    }, this.fetchIntervalMs);

    this.schedulerRegistry.addInterval(AGGREGATION_INTERVAL_NAME, interval);
    this.logger.log(`Scheduling aggregation every ${this.fetchIntervalMs}ms.`);
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
      this.logger.warn('Skipping aggregation cycle because the previous one is still running.');
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
