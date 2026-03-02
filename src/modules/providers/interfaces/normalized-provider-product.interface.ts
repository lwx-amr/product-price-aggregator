import { ProviderName } from '@core/enums';

export interface NormalizedProviderProduct {
  providerName: ProviderName;
  providerBaseUrl: string;
  externalId: string;
  canonicalKey: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  availability: boolean;
  sourceLastUpdated?: Date | null;
}
