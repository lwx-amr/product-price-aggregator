import { ChangeType, Currency } from '.prisma/client';
import type { ChangeResponseDtoParams } from '@modules/products/interfaces';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeResponseDto {
  @ApiProperty({ example: 101 })
  id: number;

  @ApiProperty({ example: 1 })
  productId: number;

  @ApiProperty({ example: 'NestJS Masterclass' })
  productName: string;

  @ApiProperty({ example: 'nestjs-masterclass' })
  canonicalKey: string;

  @ApiProperty({ example: 'provider-a' })
  providerName: string;

  @ApiProperty({ example: 'provider-a-nestjs-masterclass' })
  externalId: string;

  @ApiProperty({ example: 79.99 })
  price: number;

  @ApiProperty({ example: 59.99, nullable: true })
  oldPrice: number | null;

  @ApiProperty({ enum: Currency, example: Currency.USD })
  currency: Currency;

  @ApiProperty({ example: true })
  availability: boolean;

  @ApiProperty({ example: false, nullable: true })
  oldAvailability: boolean | null;

  @ApiProperty({ enum: ChangeType, example: ChangeType.BOTH })
  changeType: ChangeType;

  @ApiProperty({ example: '2026-03-02T10:05:00.000Z' })
  changedAt: Date;

  constructor(params: ChangeResponseDtoParams) {
    this.id = params.id;
    this.productId = params.providerProduct.product.id;
    this.productName = params.providerProduct.product.name;
    this.canonicalKey = params.providerProduct.product.canonicalKey;
    this.providerName = params.providerProduct.provider.name;
    this.externalId = params.providerProduct.externalId;
    this.price = params.price.toNumber();
    this.oldPrice = params.oldPrice ? params.oldPrice.toNumber() : null;
    this.currency = params.currency;
    this.availability = params.availability;
    this.oldAvailability = params.oldAvailability;
    this.changeType = params.changeType;
    this.changedAt = params.changedAt;
  }
}
