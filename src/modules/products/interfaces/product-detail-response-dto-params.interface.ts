import type { OfferWithHistoryResponseDtoParams } from './offer-with-history-response-dto-params.interface';

export interface ProductDetailResponseDtoParams {
  id: number;
  canonicalKey: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  providerProducts: OfferWithHistoryResponseDtoParams[];
}
