import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Product Price Aggregator')
  .setDescription(
    'API for aggregating pricing and availability data for digital products from multiple providers',
  )
  .setVersion('1.0')
  .addApiKey(
    {
      type: 'apiKey',
      name: 'x-api-key',
      in: 'header',
    },
    'api-key',
  )
  .build();
