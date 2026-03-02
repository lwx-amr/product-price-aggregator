import type { Environment } from '@config';
import { SettledStatus } from '@core/enums';
import { PROVIDER_ADAPTERS } from '@modules/providers/constants';
import type { NormalizedProviderProduct, ProviderAdapter } from '@modules/providers/interfaces';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AggregationProviderResult, AggregationRunSummary } from '../interfaces';
import { AggregationPersistenceService } from './aggregation-persistence.service';

@Injectable()
export class AggregationService {
  private readonly logger = new Logger(AggregationService.name);
  private readonly staleThresholdMs: number;

  constructor(
    @Inject(PROVIDER_ADAPTERS) private readonly providerAdapters: ProviderAdapter[],
    private readonly aggregationPersistenceService: AggregationPersistenceService,
    private readonly configService: ConfigService<Environment, true>,
  ) {
    this.staleThresholdMs = this.configService.get('STALE_THRESHOLD_MS', { infer: true });
  }

  async runAggregationCycle(): Promise<AggregationRunSummary> {
    const startedAt = Date.now();
    const settledResults = await Promise.allSettled(
      this.providerAdapters.map((adapter) => adapter.fetchProducts()),
    );

    const providers: AggregationProviderResult[] = [];
    const allItems: NormalizedProviderProduct[] = [];

    for (const [index, settledResult] of settledResults.entries()) {
      const providerName = this.providerAdapters[index]!.providerName;

      if (settledResult.status === SettledStatus.FULFILLED) {
        providers.push({
          providerName,
          status: SettledStatus.FULFILLED,
          itemCount: settledResult.value.length,
        });
        allItems.push(...settledResult.value);
        continue;
      }

      const errorMessage =
        settledResult.reason instanceof Error ? settledResult.reason.message : 'Unknown error';

      providers.push({
        providerName,
        status: SettledStatus.REJECTED,
        itemCount: 0,
        errorMessage,
      });
      this.logger.error(`Aggregation failed for ${providerName}: ${errorMessage}`);
    }

    await this.aggregationPersistenceService.persistBatch(allItems);
    const staleProductsMarked = await this.aggregationPersistenceService.markStaleProducts(
      this.staleThresholdMs,
    );

    const summary: AggregationRunSummary = {
      durationMs: Date.now() - startedAt,
      totalItems: allItems.length,
      providersOk: providers.filter((provider) => provider.status === SettledStatus.FULFILLED)
        .length,
      providersFailed: providers.filter((provider) => provider.status === SettledStatus.REJECTED)
        .length,
      staleProductsMarked,
      providers,
    };

    this.logger.log(
      `Aggregation cycle completed in ${summary.durationMs}ms: ${summary.totalItems} items from ${summary.providersOk} providers.`,
    );

    return summary;
  }
}
