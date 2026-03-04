import { ApiProperty } from '@nestjs/swagger';
import { InternalProduct } from '../../interfaces';

export class ProviderAProductResponseDto {
  @ApiProperty({
    description: 'Provider A product identifier',
    example: 'prov-a-nestjs-masterclass',
  })
  id: string;

  @ApiProperty({ description: 'Product display name', example: 'NestJS Masterclass' })
  name: string;

  @ApiProperty({
    description: 'Short product summary',
    example: 'Advanced NestJS course for backend engineers.',
  })
  description: string;

  @ApiProperty({ description: 'Current price in the given currency', example: 79.99 })
  price: number;

  @ApiProperty({ description: 'Three-letter currency code', example: 'USD' })
  currency: string;

  @ApiProperty({ description: 'Whether the product is currently available', example: true })
  available: boolean;

  @ApiProperty({
    description: 'ISO 8601 timestamp of last data update',
    example: '2026-02-28T12:00:00.000Z',
  })
  lastUpdated: string;

  constructor(product: InternalProduct) {
    this.id = product.id;
    this.name = product.name;
    this.description = product.description;
    this.price = product.price;
    this.currency = product.currency;
    this.available = product.available;
    this.lastUpdated = new Date(product.lastUpdated).toISOString();
  }
}
