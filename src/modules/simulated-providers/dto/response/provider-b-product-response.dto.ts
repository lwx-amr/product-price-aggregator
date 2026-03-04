import { ApiProperty } from '@nestjs/swagger';
import { InternalProduct } from '../../interfaces';

class ProviderBCostDto {
  @ApiProperty({ description: 'Price amount', example: 79.99 })
  amount!: number;

  @ApiProperty({ description: 'Three-letter currency code', example: 'USD' })
  currency!: string;
}

export class ProviderBProductResponseDto {
  @ApiProperty({
    description: 'Stock keeping unit identifier',
    example: 'prov-b-nestjs-masterclass',
  })
  sku: string;

  @ApiProperty({ description: 'Product title', example: 'NestJS Masterclass' })
  title: string;

  @ApiProperty({
    description: 'Product details text',
    example: 'Advanced NestJS course for backend engineers.',
  })
  details: string;

  @ApiProperty({ description: 'Nested pricing object', type: ProviderBCostDto })
  cost: ProviderBCostDto;

  @ApiProperty({
    description: 'Current stock status',
    example: 'in_stock',
    enum: ['in_stock', 'out_of_stock'],
  })
  stockStatus: 'in_stock' | 'out_of_stock';

  @ApiProperty({
    description: 'ISO 8601 timestamp of last update',
    example: '2026-02-28T12:00:00Z',
  })
  updated_at: string;

  constructor(product: InternalProduct) {
    this.sku = product.id;
    this.title = product.name;
    this.details = product.description;
    this.cost = { amount: product.price, currency: product.currency };
    this.stockStatus = product.available ? 'in_stock' : 'out_of_stock';
    this.updated_at = new Date(product.lastUpdated).toISOString().replace(/\.\d{3}Z$/, 'Z');
  }
}
