import { Currency } from '.prisma/client';
import type { OfferResponseDtoParams } from '@modules/products/interfaces';
import { ApiProperty } from '@nestjs/swagger';

export class OfferResponseDto {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: 'provider-a-nestjs-masterclass' })
  externalId: string;

  @ApiProperty({ example: 'provider-a' })
  providerName: string;

  @ApiProperty({ example: 79.99 })
  price: number;

  @ApiProperty({ enum: Currency, example: Currency.USD })
  currency: Currency;

  @ApiProperty({ example: true })
  availability: boolean;

  @ApiProperty({
    example: '2026-03-02T10:00:00.000Z',
    nullable: true,
  })
  sourceLastUpdated: Date | null;

  @ApiProperty({ example: '2026-03-02T10:00:05.000Z' })
  fetchedAt: Date;

  @ApiProperty({ example: false })
  isStale: boolean;

  constructor(params: OfferResponseDtoParams) {
    this.id = params.id;
    this.externalId = params.externalId;
    this.providerName = params.provider.name;
    this.price = params.price.toNumber();
    this.currency = params.currency;
    this.availability = params.availability;
    this.sourceLastUpdated = params.sourceLastUpdated;
    this.fetchedAt = params.fetchedAt;
    this.isStale = params.isStale;
  }
}
