import { Currency } from '.prisma/client';
import { Decimal } from '@prisma/client/runtime/client';

export interface OfferResponseDtoParams {
  id: number;
  externalId: string;
  price: Decimal;
  currency: Currency;
  availability: boolean;
  sourceLastUpdated: Date | null;
  fetchedAt: Date;
  isStale: boolean;
  provider: { name: string };
}
