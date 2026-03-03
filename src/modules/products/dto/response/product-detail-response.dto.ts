import type { ProductDetailResponseDtoParams } from '@modules/products/interfaces';
import { ApiProperty } from '@nestjs/swagger';
import { OfferWithHistoryResponseDto } from './offer-with-history-response.dto';

export class ProductDetailResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'nestjs-masterclass' })
  canonicalKey: string;

  @ApiProperty({ example: 'NestJS Masterclass' })
  name: string;

  @ApiProperty({
    example: 'Advanced NestJS course for backend engineers.',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ example: '2026-03-02T09:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-02T10:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({
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
