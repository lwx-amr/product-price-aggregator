import { ChangeType, Currency } from '.prisma/client';
import { Decimal } from '@prisma/client/runtime/client';

export interface ChangeResponseDtoParams {
  id: number;
  price: Decimal;
  oldPrice: Decimal | null;
  currency: Currency;
  availability: boolean;
  oldAvailability: boolean | null;
  changeType: ChangeType;
  changedAt: Date;
  providerProduct: {
    externalId: string;
    provider: { name: string };
    product: { id: number; name: string; canonicalKey: string };
  };
}
