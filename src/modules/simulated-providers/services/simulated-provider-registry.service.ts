import type { Environment } from '@config';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { setTimeout as sleep } from 'node:timers/promises';
import { seedProducts } from '../data/seed-products';
import { ProviderName } from '../enums';
import type { InternalProduct } from '../interfaces';

@Injectable()
export class SimulatedProviderRegistryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SimulatedProviderRegistryService.name);
  private readonly products = new Map<ProviderName, InternalProduct[]>();
  private readonly mutationIntervalMs: number;
  private readonly failureRate: number;
  private readonly maxDelayMs: number;
  private intervalHandle?: NodeJS.Timeout;

  constructor(private readonly configService: ConfigService<Environment, true>) {
    this.mutationIntervalMs = this.configService.get('SIM_MUTATION_INTERVAL_MS', {
      infer: true,
    });
    this.failureRate = this.configService.get('SIM_FAILURE_RATE', { infer: true });
    this.maxDelayMs = this.configService.get('SIM_MAX_DELAY_MS', { infer: true });
  }

  onModuleInit(): void {
    const now = Date.now();

    for (const [providerName, providerProducts] of Object.entries(seedProducts) as Array<
      [ProviderName, (typeof seedProducts)[ProviderName]]
    >) {
      this.products.set(
        providerName,
        providerProducts.map((product) => ({
          ...product,
          lastUpdated: now,
        })),
      );
    }

    this.intervalHandle = setInterval(() => this.mutateAll(), this.mutationIntervalMs);
    this.logger.log(
      `Simulated provider registry started with ${this.mutationIntervalMs}ms mutation interval.`,
    );
  }

  onModuleDestroy(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = undefined;
    }
  }

  getProductsSnapshot(providerName: ProviderName): InternalProduct[] {
    return structuredClone(this.products.get(providerName) ?? []);
  }

  shouldSimulateFailure(): boolean {
    return Math.random() < this.failureRate;
  }

  async simulateDelay(): Promise<void> {
    if (this.maxDelayMs === 0) {
      return;
    }

    await sleep(this.randomInteger(0, this.maxDelayMs));
  }

  private mutateAll(): void {
    for (const [providerName, providerProducts] of this.products.entries()) {
      const nextProducts = providerProducts.map((product) => this.mutateProduct(product));
      this.products.set(providerName, nextProducts);
    }
  }

  private mutateProduct(product: InternalProduct): InternalProduct {
    let hasChanged = false;
    let nextPrice = product.price;
    let nextAvailability = product.available;

    const priceDeltaFactor = this.randomDecimal(-0.05, 0.05);
    nextPrice = this.roundCurrency(Math.max(0.99, product.price * (1 + priceDeltaFactor)));
    hasChanged = nextPrice !== product.price;

    if (Math.random() < 0.05) {
      nextAvailability = !product.available;
      hasChanged = true;
    }

    if (!hasChanged) {
      return product;
    }

    return {
      ...product,
      price: nextPrice,
      available: nextAvailability,
      lastUpdated: Date.now(),
    };
  }

  private roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private randomDecimal(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private randomInteger(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
