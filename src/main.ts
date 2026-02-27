import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import type { Environment } from '@/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Environment, true>);
  const port = config.get('PORT', { infer: true });
  await app.listen(port);
}
bootstrap();
