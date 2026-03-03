import { AggregationModule } from '@modules/aggregation/aggregation.module';
import { validate } from '@config';
import { PrismaModule } from '@modules/database/prisma.module';
import { ProvidersModule } from '@modules/providers/providers.module';
import { ProductsModule } from '@modules/products/products.module';
import { SimulatedProvidersModule } from '@modules/simulated-providers/simulated-providers.module';
import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    ProvidersModule,
    SimulatedProvidersModule,
    AggregationModule,
    ProductsModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        stopAtFirstError: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    },
  ],
})
export class AppModule {}
