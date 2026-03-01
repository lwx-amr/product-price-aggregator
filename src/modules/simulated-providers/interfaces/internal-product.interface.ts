import { ProviderName } from '@core/enums';

export interface SeedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  available: boolean;
}

export interface InternalProduct extends SeedProduct {
  lastUpdated: number;
}

export interface SeedProductRegistry {
  [ProviderName.PROVIDER_A]: SeedProduct[];
  [ProviderName.PROVIDER_B]: SeedProduct[];
  [ProviderName.PROVIDER_C]: SeedProduct[];
}
