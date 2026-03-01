import { ProviderName } from '@core/enums';
import { NormalizedProviderProduct } from './normalized-provider-product.interface';

export interface ProviderAdapter {
  providerName: ProviderName;
  fetchProducts(): Promise<NormalizedProviderProduct[]>;
}
