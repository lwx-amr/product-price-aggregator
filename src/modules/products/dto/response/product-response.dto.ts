import type { OfferResponseDtoParams } from '@modules/products/interfaces';
import { ApiProperty } from '@nestjs/swagger';
import { OfferResponseDto } from './offer-response.dto';

export class ProductResponseDto {
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

  @ApiProperty({
    description: 'Provider-specific offers for this product',
    type: OfferResponseDto,
    isArray: true,
  })
  offers: OfferResponseDto[];

  constructor(params: {
    id: number;
    canonicalKey: string;
    name: string;
    description: string | null;
    providerProducts: OfferResponseDtoParams[];
  }) {
    this.id = params.id;
    this.canonicalKey = params.canonicalKey;
    this.name = params.name;
    this.description = params.description;
    this.offers = params.providerProducts.map(
      (providerProducts) => new OfferResponseDto(providerProducts),
    );
  }
}
