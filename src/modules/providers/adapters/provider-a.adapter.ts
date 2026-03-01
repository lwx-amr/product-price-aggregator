import type { Environment } from '@config';
import { ProviderName } from '@core/enums';
import { HttpClientFactory, type HttpClient } from '@modules/shared/services';
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
  private readonly httpClient: HttpClient;

  constructor(
    private readonly configService: ConfigService<Environment, true>,
    private readonly providersService: ProvidersService,
    httpClientFactory: HttpClientFactory,
  ) {
    this.httpClient = httpClientFactory.create({
      baseUrl: this.configService.get('PROVIDER_A_URL', { infer: true }),
      label: this.providerName,
    });
  }

  async fetchProducts(): Promise<NormalizedProviderProduct[]> {
    const products = await this.httpClient.request<ProviderAProductResponse[]>();

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
