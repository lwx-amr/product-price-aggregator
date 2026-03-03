import type { HistoryEntryResponseDtoParams } from './history-entry-response-dto-params.interface';
import type { OfferResponseDtoParams } from './offer-response-dto-params.interface';

export interface OfferWithHistoryResponseDtoParams extends OfferResponseDtoParams {
  history: HistoryEntryResponseDtoParams[];
}
