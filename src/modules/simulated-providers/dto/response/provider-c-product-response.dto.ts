import { ApiProperty } from '@nestjs/swagger';
import { InternalProduct } from '../../interfaces';

export class ProviderCProductResponseDto {
  @ApiProperty({ example: 'prov-c-nestjs-masterclass' })
  productId: string;

  @ApiProperty({ example: 'NestJS Masterclass' })
  productName: string;

  @ApiProperty({ example: 'Advanced NestJS course for backend engineers.' })
  desc: string;

  @ApiProperty({ example: 7999 })
  priceInCents: number;

  @ApiProperty({ example: 'USD' })
  currencyCode: string;

  @ApiProperty({ example: 1, enum: [0, 1] })
  isAvailable: 0 | 1;

  @ApiProperty({ example: 1772280000000 })
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
