import type { ProductDetailResponseDtoParams } from '@modules/products/interfaces';
import { ApiProperty } from '@nestjs/swagger';
import { OfferWithHistoryResponseDto } from './offer-with-history-response.dto';

export class ProductDetailResponseDto {
  @ApiProperty({ description: 'Canonical product ID', example: 1 })
  id: number;

  @ApiProperty({
    description: 'Slugified key shared across providers',
    example: 'nestjs-masterclass',
  })
  canonicalKey: string;

  @ApiProperty({ description: 'Product display name', example: 'NestJS Masterclass' })
  name: string;

  @ApiProperty({
    description: 'Short product summary',
    example: 'Advanced NestJS course for backend engineers.',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ description: 'Record creation timestamp', example: '2026-03-02T09:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last record update timestamp', example: '2026-03-02T10:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Provider-specific offers with recent price history',
    type: OfferWithHistoryResponseDto,
    isArray: true,
  })
  offers: OfferWithHistoryResponseDto[];

  constructor(params: ProductDetailResponseDtoParams) {
    this.id = params.id;
    this.canonicalKey = params.canonicalKey;
    this.name = params.name;
    this.description = params.description;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
    this.offers = params.providerProducts.map(
      (providerProduct) => new OfferWithHistoryResponseDto(providerProduct),
    );
  }
}
