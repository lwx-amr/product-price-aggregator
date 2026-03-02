import type { Environment } from '@config';
import { ProviderName } from '@core/enums';
import { HttpClientFactory, type HttpClient } from '@modules/shared/services';
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
  private readonly httpClient: HttpClient;
  private readonly providerBaseUrl: string;

  constructor(
    private readonly configService: ConfigService<Environment, true>,
    private readonly providersService: ProvidersService,
    httpClientFactory: HttpClientFactory,
  ) {
    this.providerBaseUrl = this.configService.get('PROVIDER_B_URL', { infer: true });
    this.httpClient = httpClientFactory.create({
      baseUrl: this.providerBaseUrl,
      label: this.providerName,
    });
  }

  async fetchProducts(): Promise<NormalizedProviderProduct[]> {
    const products = await this.httpClient.request<ProviderBProductResponse[]>();

    return products.map((product) => ({
      providerName: this.providerName,
      providerBaseUrl: this.providerBaseUrl,
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
