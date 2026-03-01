export interface ProviderCProductResponse {
  productId: string;
  productName: string;
  desc: string;
  priceInCents: number;
  currencyCode: string;
  isAvailable: 0 | 1;
  last_updated_epoch: number;
}
