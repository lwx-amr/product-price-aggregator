import type { Environment } from '@config';
import { validate } from '@config';
import { HttpExceptionFilter } from '@core/filters';
import { ApiKeyGuard } from '@core/guards';
import { LoggingInterceptor } from '@core/interceptors';
import { buildPinoOptions, buildThrottlerOptions } from '@module-options';
import { AggregationModule } from '@modules/aggregation/aggregation.module';
import { PrismaModule } from '@modules/database/prisma.module';
import { HealthModule } from '@modules/health/health.module';
import { ProductsModule } from '@modules/products/products.module';
import { ProvidersModule } from '@modules/providers/providers.module';
import { SimulatedProvidersModule } from '@modules/simulated-providers/simulated-providers.module';
import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => buildPinoOptions(config),
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => buildThrottlerOptions(config),
    }),
    PrismaModule,
    ProvidersModule,
    HealthModule,
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
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
