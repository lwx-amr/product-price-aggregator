import { ProviderName, SettledStatus } from '@core/enums';

export interface AggregationProviderResult {
  providerName: ProviderName;
  status: SettledStatus;
  itemCount: number;
  errorMessage?: string;
}

export interface AggregationRunSummary {
  durationMs: number;
  totalItems: number;
  providersOk: number;
  providersFailed: number;
  staleProductsMarked: number;
  providers: AggregationProviderResult[];
}
