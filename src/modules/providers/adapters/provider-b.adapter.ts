import type { Environment } from '@config';
import { ProviderName } from '@core/enums';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  NormalizedProviderProduct,
  ProviderAdapter,
  ProviderBProductResponse,
} from '../interfaces';
import { ProvidersService } from '../providers.service';

@Injectable()
export class ProviderBAdapter implements ProviderAdapter {
  readonly providerName = ProviderName.PROVIDER_B;

  constructor(
    private readonly configService: ConfigService<Environment, true>,
    private readonly providersService: ProvidersService,
  ) {}

  async fetchProducts(): Promise<NormalizedProviderProduct[]> {
    const endpoint = this.configService.get('PROVIDER_B_URL', { infer: true });
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Provider B request failed with status ${response.status}`);
    }

    const products = (await response.json()) as ProviderBProductResponse[];

    return products.map((product) => ({
      providerName: this.providerName,
      externalId: product.sku,
      canonicalKey: this.providersService.slugify(product.title),
      name: product.title,
      description: product.details,
      price: product.cost.amount.toFixed(2),
      currency: product.cost.currency.toUpperCase(),
      availability: product.stockStatus === 'in_stock',
      sourceLastUpdated: this.providersService.safeParseDate(product.updated_at),
    }));
  }
}
