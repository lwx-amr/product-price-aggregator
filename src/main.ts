import type { Environment } from '@config';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { bootstrap } from './bootstrap';

async function main() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService<Environment, true>);
  const logger = app.get(Logger);

  app.useLogger(logger);
  bootstrap(app);

  const port = config.get('PORT', { infer: true });
  await app.listen(port);

  logger.log(`Application running on http://localhost:${port}`);
}
main();
