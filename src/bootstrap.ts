import type { Environment } from '@config';
import { getCorsConfig, getHelmetConfig, swaggerConfig } from '@config';
import { NodeEnvironment } from '@core/enums';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

export function bootstrap(app: INestApplication): void {
  const config = app.get(ConfigService<Environment, true>);
  const nodeEnv = config.get('NODE_ENV', { infer: true });
  const isProduction = nodeEnv === NodeEnvironment.PRODUCTION;

  // Security headers
  app.use(helmet(getHelmetConfig(isProduction)));

  // CORS
  const allowedOrigins = config.get('ALLOWED_ORIGINS', { infer: true });
  app.enableCors(getCorsConfig(allowedOrigins, nodeEnv));

  app.setGlobalPrefix('api/v1');

  // Swagger
  const swaggerPath = config.get('SWAGGER_PATH', { infer: true });
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(swaggerPath, app, document);
}
