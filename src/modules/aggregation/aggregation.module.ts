import { PrismaModule } from '@modules/database/prisma.module';
import { ProvidersModule } from '@modules/providers/providers.module';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import {
  AggregationPersistenceService,
  AggregationSchedulerService,
  AggregationService,
} from './services';

@Module({
  imports: [ProvidersModule, PrismaModule, EventEmitterModule],
  providers: [AggregationService, AggregationPersistenceService, AggregationSchedulerService],
})
export class AggregationModule {}
