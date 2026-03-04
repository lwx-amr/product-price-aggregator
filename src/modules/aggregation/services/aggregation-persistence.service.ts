import { ChangeType, Currency, type Product, type Provider } from '.prisma/client';
import { TRANSACTION_MAX_WAIT_MS, TRANSACTION_TIMEOUT_MS } from '@modules/database/constants';
import { PrismaService } from '@modules/database/prisma.service';
import type { NormalizedProviderProduct } from '@modules/providers/interfaces';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Decimal } from '@prisma/client/runtime/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AggregationEvent, type AggregationEventPayload } from '../events';

@Injectable()
export class AggregationPersistenceService {
  private readonly validCurrencies = new Set<Currency>(Object.values(Currency));

  constructor(
    private readonly prismaService: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    @InjectPinoLogger(AggregationPersistenceService.name)
    private readonly logger: PinoLogger,
  ) {}

  async persistBatch(items: NormalizedProviderProduct[]): Promise<void> {
    const providerMap = await this.batchUpsertProviders(items);
    const productMap = await this.batchUpsertProducts(items);

    const changePayloads = await this.prismaService.$transaction(
      async (tx) => {
        const payloads: AggregationEventPayload<AggregationEvent.PRODUCT_CHANGE>[] = [];

        for (const item of items) {
          try {
            const provider = providerMap.get(item.providerName);
            const product = productMap.get(item.canonicalKey);

            if (!provider || !product) {
              this.logger.error(
                { providerName: item.providerName, canonicalKey: item.canonicalKey },
                'Provider or product not found in pre-fetched maps',
              );
              continue;
            }

            const payload = await this.persistItem(tx, item, provider, product);

            if (payload) {
              payloads.push(payload);
            }
          } catch (error) {
            this.logger.error(
              {
                providerName: item.providerName,
                externalId: item.externalId,
                canonicalKey: item.canonicalKey,
                err: error,
              },
              'Failed to persist normalized provider product',
            );
          }
        }

        return payloads;
      },
      {
        timeout: TRANSACTION_TIMEOUT_MS,
        maxWait: TRANSACTION_MAX_WAIT_MS,
      },
    );

    for (const payload of changePayloads) {
      this.eventEmitter.emit(AggregationEvent.PRODUCT_CHANGE, payload);
    }
  }

  async markStaleProducts(staleThresholdMs: number): Promise<number> {
    const staleBefore = new Date(Date.now() - staleThresholdMs);
    const result = await this.prismaService.providerProduct.updateMany({
      where: {
        fetchedAt: { lt: staleBefore },
        isStale: false,
      },
      data: {
        isStale: true,
      },
    });

    if (result.count > 0) {
      this.logger.warn(
        { count: result.count, staleThresholdMs },
        'Marked provider products as stale',
      );
    }

    return result.count;
  }

  private async batchUpsertProviders(
    items: NormalizedProviderProduct[],
  ): Promise<Map<string, Provider>> {
    const uniqueProviders = new Map<string, NormalizedProviderProduct>();

    for (const item of items) {
      if (!uniqueProviders.has(item.providerName)) {
        uniqueProviders.set(item.providerName, item);
      }
    }

    await this.prismaService.$transaction(
      [...uniqueProviders.values()].map((item) =>
        this.prismaService.provider.upsert({
          where: { name: item.providerName },
          update: { baseUrl: item.providerBaseUrl },
          create: { name: item.providerName, baseUrl: item.providerBaseUrl },
        }),
      ),
    );

    const providers = await this.prismaService.provider.findMany({
      where: { name: { in: [...uniqueProviders.keys()] } },
    });

    return new Map(providers.map((p) => [p.name, p]));
  }

  private async batchUpsertProducts(
    items: NormalizedProviderProduct[],
  ): Promise<Map<string, Product>> {
    const uniqueProducts = new Map<string, NormalizedProviderProduct>();

    for (const item of items) {
      if (!uniqueProducts.has(item.canonicalKey)) {
        uniqueProducts.set(item.canonicalKey, item);
      }
    }

    await this.prismaService.$transaction(
      [...uniqueProducts.values()].map((item) =>
        this.prismaService.product.upsert({
          where: { canonicalKey: item.canonicalKey },
          update: {},
          create: {
            canonicalKey: item.canonicalKey,
            name: item.name,
            description: item.description,
          },
        }),
      ),
    );

    const products = await this.prismaService.product.findMany({
      where: { canonicalKey: { in: [...uniqueProducts.keys()] } },
    });

    return new Map(products.map((p) => [p.canonicalKey, p]));
  }

  private async persistItem(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0] & Function>[0],
    item: NormalizedProviderProduct,
    provider: Provider,
    product: Product,
  ): Promise<AggregationEventPayload<AggregationEvent.PRODUCT_CHANGE> | null> {
    const price = this.toDecimal(item);
    const currency = this.toCurrency(item);
    const now = new Date();

    const existingProviderProduct = await tx.providerProduct.findUnique({
      where: {
        providerId_externalId: {
          providerId: provider.id,
          externalId: item.externalId,
        },
      },
    });

    if (!existingProviderProduct) {
      const createdProviderProduct = await tx.providerProduct.create({
        data: {
          providerId: provider.id,
          productId: product.id,
          externalId: item.externalId,
          price,
          currency,
          availability: item.availability,
          sourceLastUpdated: item.sourceLastUpdated ?? null,
          fetchedAt: now,
          isStale: false,
        },
      });

      await tx.providerProductHistory.create({
        data: {
          providerProductId: createdProviderProduct.id,
          price,
          oldPrice: null,
          currency,
          availability: item.availability,
          oldAvailability: null,
          changeType: ChangeType.INITIAL,
          changedAt: now,
        },
      });

      return null;
    }

    const priceChanged = !existingProviderProduct.price.equals(price);
    const availabilityChanged = existingProviderProduct.availability !== item.availability;
    let payload: AggregationEventPayload<AggregationEvent.PRODUCT_CHANGE> | null = null;

    if (priceChanged || availabilityChanged) {
      const changeType = this.resolveChangeType(priceChanged, availabilityChanged);

      await tx.providerProductHistory.create({
        data: {
          providerProductId: existingProviderProduct.id,
          price,
          oldPrice: existingProviderProduct.price,
          currency,
          availability: item.availability,
          oldAvailability: existingProviderProduct.availability,
          changeType,
          changedAt: now,
        },
      });

      payload = {
        productId: product.id,
        productName: product.name,
        canonicalKey: product.canonicalKey,
        providerName: provider.name,
        externalId: item.externalId,
        price: item.price,
        oldPrice: existingProviderProduct.price.toString(),
        currency,
        availability: item.availability,
        oldAvailability: existingProviderProduct.availability,
        changeType,
        changedAt: now,
      };
    }

    await tx.providerProduct.update({
      where: { id: existingProviderProduct.id },
      data: {
        price,
        currency,
        availability: item.availability,
        sourceLastUpdated: item.sourceLastUpdated ?? null,
        fetchedAt: now,
        isStale: false,
      },
    });

    return payload;
  }

  private resolveChangeType(priceChanged: boolean, availabilityChanged: boolean): ChangeType {
    if (priceChanged && availabilityChanged) {
      return ChangeType.BOTH;
    }

    if (priceChanged) {
      return ChangeType.PRICE_CHANGE;
    }

    return ChangeType.AVAILABILITY_CHANGE;
  }

  private toDecimal(item: NormalizedProviderProduct): Decimal {
    const priceNumber = Number(item.price);

    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      throw new Error(`Invalid price "${item.price}" for ${item.providerName}:${item.externalId}`);
    }

    return new Decimal(item.price);
  }

  private toCurrency(item: NormalizedProviderProduct): Currency {
    if (!this.validCurrencies.has(item.currency as Currency)) {
      throw new Error(
        `Invalid currency "${item.currency}" for ${item.providerName}:${item.externalId}`,
      );
    }

    return item.currency as Currency;
  }
}
