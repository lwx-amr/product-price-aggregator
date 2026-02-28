import type { Environment } from '@config';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { bootstrap } from './bootstrap';

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
