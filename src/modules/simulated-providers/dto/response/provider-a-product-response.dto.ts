import { ApiProperty } from '@nestjs/swagger';
import { InternalProduct } from '../../interfaces';

export class ProviderAProductResponseDto {
  @ApiProperty({ example: 'prov-a-nestjs-masterclass' })
  id: string;

  @ApiProperty({ example: 'NestJS Masterclass' })
  name: string;

  @ApiProperty({ example: 'Advanced NestJS course for backend engineers.' })
  description: string;

  @ApiProperty({ example: 79.99 })
  price: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: true })
  available: boolean;

  @ApiProperty({ example: '2026-02-28T12:00:00.000Z' })
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
