import { PrismaModule } from '@modules/database/prisma.module';
import { ProvidersModule } from '@modules/providers/providers.module';
import { Module } from '@nestjs/common';
import {
  AggregationPersistenceService,
  AggregationSchedulerService,
  AggregationService,
} from './services';

@Module({
  imports: [ProvidersModule, PrismaModule],
  providers: [AggregationService, AggregationPersistenceService, AggregationSchedulerService],
})
export class AggregationModule {}
