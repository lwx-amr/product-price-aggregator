import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { bootstrap } from './bootstrap';
import type { Environment } from '@/config';

async function main() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Environment, true>);

  bootstrap(app);

  const port = config.get('PORT', { infer: true });
  await app.listen(port);

  const logger = new Logger('Main');
  logger.log(`Application running on http://localhost:${port}`);
}
main();
