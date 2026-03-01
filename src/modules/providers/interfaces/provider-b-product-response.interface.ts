export interface ProviderBProductResponse {
  sku: string;
  title: string;
  details: string;
  cost: {
    amount: number;
    currency: string;
  };
  stockStatus: 'in_stock' | 'out_of_stock';
  updated_at: string;
}
