import { Module } from '@nestjs/common';
import { ProviderAController, ProviderBController, ProviderCController } from './controllers';
import { SimulatedProviderRegistryService } from './services';

@Module({
  controllers: [ProviderAController, ProviderBController, ProviderCController],
  providers: [SimulatedProviderRegistryService],
  exports: [SimulatedProviderRegistryService],
})
export class SimulatedProvidersModule {}
