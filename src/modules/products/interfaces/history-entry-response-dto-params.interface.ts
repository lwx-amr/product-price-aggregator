import { ChangeType, Currency } from '.prisma/client';
import { Decimal } from '@prisma/client/runtime/client';

export interface HistoryEntryResponseDtoParams {
  id: number;
  price: Decimal;
  oldPrice: Decimal | null;
  currency: Currency;
  availability: boolean;
  oldAvailability: boolean | null;
  changeType: ChangeType;
  changedAt: Date;
}
