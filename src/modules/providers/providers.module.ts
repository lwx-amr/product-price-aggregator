import { Module } from '@nestjs/common';
import { ProviderAAdapter, ProviderBAdapter, ProviderCAdapter } from './adapters';
import { PROVIDER_ADAPTERS } from './constants';
import { ProvidersService } from './providers.service';

@Module({
  providers: [
    ProvidersService,
    ProviderAAdapter,
    ProviderBAdapter,
    ProviderCAdapter,
    {
      provide: PROVIDER_ADAPTERS,
      useFactory: (
        providerAAdapter: ProviderAAdapter,
        providerBAdapter: ProviderBAdapter,
        providerCAdapter: ProviderCAdapter,
      ) => [providerAAdapter, providerBAdapter, providerCAdapter],
      inject: [ProviderAAdapter, ProviderBAdapter, ProviderCAdapter],
    },
  ],
  exports: [PROVIDER_ADAPTERS],
})
export class ProvidersModule {}
