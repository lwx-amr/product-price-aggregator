import { validate } from '@config';
import { PrismaModule } from '@modules/database/prisma.module';
import { ProvidersModule } from '@modules/providers/providers.module';
import { SimulatedProvidersModule } from '@modules/simulated-providers/simulated-providers.module';
import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    PrismaModule,
    ProvidersModule,
    SimulatedProvidersModule,
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
