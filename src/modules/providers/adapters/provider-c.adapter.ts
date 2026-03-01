import type { Environment } from '@config';
import { ProviderName } from '@core/enums';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  NormalizedProviderProduct,
  ProviderAdapter,
  ProviderCProductResponse,
} from '../interfaces';
import { ProvidersService } from '../providers.service';

@Injectable()
export class ProviderCAdapter implements ProviderAdapter {
  readonly providerName = ProviderName.PROVIDER_C;

  constructor(
    private readonly configService: ConfigService<Environment, true>,
    private readonly providersService: ProvidersService,
  ) {}

  async fetchProducts(): Promise<NormalizedProviderProduct[]> {
    const endpoint = this.configService.get('PROVIDER_C_URL', { infer: true });
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Provider C request failed with status ${response.status}`);
    }

    const products = (await response.json()) as ProviderCProductResponse[];

    return products.map((product) => ({
      providerName: this.providerName,
      externalId: product.productId,
      canonicalKey: this.providersService.slugify(product.productName),
      name: product.productName,
      description: product.desc,
      price: (product.priceInCents / 100).toFixed(2),
      currency: product.currencyCode.toUpperCase(),
      availability: product.isAvailable === 1,
      sourceLastUpdated: this.providersService.safeParseDate(product.last_updated_epoch),
    }));
  }
}
