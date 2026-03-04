import { ChangeType, Currency } from '.prisma/client';

export interface ProductChangePayload {
  productId: number;
  productName: string;
  canonicalKey: string;
  providerName: string;
  externalId: string;
  price: string;
  oldPrice: string;
  currency: Currency;
  availability: boolean;
  oldAvailability: boolean;
  changeType: ChangeType;
  changedAt: Date;
}
