import { ApiProperty } from '@nestjs/swagger';
import type { OfferWithHistoryResponseDtoParams } from '@modules/products/interfaces';
import { HistoryEntryResponseDto } from './history-entry-response.dto';
import { OfferResponseDto } from './offer-response.dto';

export class OfferWithHistoryResponseDto extends OfferResponseDto {
  @ApiProperty({
    type: HistoryEntryResponseDto,
    isArray: true,
  })
  history: HistoryEntryResponseDto[];

  constructor(params: OfferWithHistoryResponseDtoParams) {
    super(params);
    this.history = params.history.map((entry) => new HistoryEntryResponseDto(entry));
  }
}
