import type { Environment } from '@config';
import { swaggerConfig } from '@config';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';

export function bootstrap(app: INestApplication): void {
  const config = app.get(ConfigService<Environment, true>);

  app.setGlobalPrefix('api/v1');

  // Swagger
  const swaggerPath = config.get('SWAGGER_PATH', { infer: true });
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(swaggerPath, app, document);
}
