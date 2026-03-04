import { ApiProperty } from '@nestjs/swagger';
import { InternalProduct } from '../../interfaces';

export class ProviderCProductResponseDto {
  @ApiProperty({
    description: 'Provider C product identifier',
    example: 'prov-c-nestjs-masterclass',
  })
  productId: string;

  @ApiProperty({ description: 'Product name', example: 'NestJS Masterclass' })
  productName: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Advanced NestJS course for backend engineers.',
  })
  desc: string;

  @ApiProperty({ description: 'Price expressed in cents', example: 7999 })
  priceInCents: number;

  @ApiProperty({ description: 'Three-letter currency code', example: 'USD' })
  currencyCode: string;

  @ApiProperty({
    description: 'Availability flag (1 = available, 0 = unavailable)',
    example: 1,
    enum: [0, 1],
  })
  isAvailable: 0 | 1;

  @ApiProperty({ description: 'Last update as Unix epoch in milliseconds', example: 1772280000000 })
  last_updated_epoch: number;

  constructor(product: InternalProduct) {
    this.productId = product.id;
    this.productName = product.name;
    this.desc = product.description;
    this.priceInCents = Math.round(product.price * 100);
    this.currencyCode = product.currency;
    this.isAvailable = product.available ? 1 : 0;
    this.last_updated_epoch = product.lastUpdated;
  }
}
