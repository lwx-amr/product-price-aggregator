import type { Environment } from '@config';
import { ProviderName } from '@core/enums';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  NormalizedProviderProduct,
  ProviderAdapter,
  ProviderAProductResponse,
} from '../interfaces';
import { ProvidersService } from '../providers.service';

@Injectable()
export class ProviderAAdapter implements ProviderAdapter {
  readonly providerName = ProviderName.PROVIDER_A;

  constructor(
    private readonly configService: ConfigService<Environment, true>,
    private readonly providersService: ProvidersService,
  ) {}

  async fetchProducts(): Promise<NormalizedProviderProduct[]> {
    const endpoint = this.configService.get('PROVIDER_A_URL', { infer: true });
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Provider A request failed with status ${response.status}`);
    }

    const products = (await response.json()) as ProviderAProductResponse[];

    return products.map((product) => ({
      providerName: this.providerName,
      externalId: product.id,
      canonicalKey: this.providersService.slugify(product.name),
      name: product.name,
      description: product.description,
      price: product.price.toFixed(2),
      currency: product.currency.toUpperCase(),
      availability: product.available,
      sourceLastUpdated: this.providersService.safeParseDate(product.lastUpdated),
    }));
  }
}
