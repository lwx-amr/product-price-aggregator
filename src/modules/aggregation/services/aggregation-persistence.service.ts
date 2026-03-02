import { ChangeType, Currency, type Product, type Provider } from '.prisma/client';
import { PrismaService } from '@modules/database/prisma.service';
import type { NormalizedProviderProduct } from '@modules/providers/interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';

@Injectable()
export class AggregationPersistenceService {
  private readonly logger = new Logger(AggregationPersistenceService.name);
  private readonly validCurrencies = new Set<Currency>(Object.values(Currency));

  constructor(private readonly prismaService: PrismaService) {}

  async persistBatch(items: NormalizedProviderProduct[]): Promise<void> {
    for (const item of items) {
      try {
        await this.persistItem(item);
      } catch (error) {
        this.logger.error(
          `Failed to persist ${item.providerName}:${item.externalId}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
  }

  async persistItem(item: NormalizedProviderProduct): Promise<void> {
    const price = this.toDecimal(item);
    const currency = this.toCurrency(item);
    const now = new Date();

    const [provider, product] = await Promise.all([
      this.upsertProvider(item),
      this.upsertProduct(item),
    ]);

    await this.prismaService.$transaction(async (tx) => {
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

        return;
      }

      const priceChanged = !existingProviderProduct.price.equals(price);
      const availabilityChanged = existingProviderProduct.availability !== item.availability;

      if (priceChanged || availabilityChanged) {
        await tx.providerProductHistory.create({
          data: {
            providerProductId: existingProviderProduct.id,
            price,
            oldPrice: existingProviderProduct.price,
            currency,
            availability: item.availability,
            oldAvailability: existingProviderProduct.availability,
            changeType: this.resolveChangeType(priceChanged, availabilityChanged),
            changedAt: now,
          },
        });
      }

      await tx.providerProduct.update({
        where: { id: existingProviderProduct.id },
        data: {
          productId: product.id,
          price,
          currency,
          availability: item.availability,
          sourceLastUpdated: item.sourceLastUpdated ?? null,
          fetchedAt: now,
          isStale: false,
        },
      });
    });
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
      this.logger.warn(`Marked ${result.count} provider products as stale.`);
    }

    return result.count;
  }

  private async upsertProvider(item: NormalizedProviderProduct): Promise<Provider> {
    return this.prismaService.provider.upsert({
      where: { name: item.providerName },
      update: {
        baseUrl: item.providerBaseUrl,
      },
      create: {
        name: item.providerName,
        baseUrl: item.providerBaseUrl,
      },
    });
  }

  private async upsertProduct(item: NormalizedProviderProduct): Promise<Product> {
    return this.prismaService.product.upsert({
      where: { canonicalKey: item.canonicalKey },
      update: {},
      create: {
        canonicalKey: item.canonicalKey,
        name: item.name,
        description: item.description,
      },
    });
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
