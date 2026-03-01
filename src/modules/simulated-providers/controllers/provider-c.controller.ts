import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProviderCProductResponseDto } from '../dto';
import { ProviderName } from '../enums';
import { SimulatedProviderRegistryService } from '../services/simulated-provider-registry.service';

@ApiTags('Simulated Providers')
@Controller('sim/providers/c')
export class ProviderCController {
  constructor(private readonly registryService: SimulatedProviderRegistryService) {}

  @Get('catalog')
  @ApiOperation({
    summary: 'Get Provider C simulated catalog',
    description:
      'Returns the current in-memory snapshot for Provider C. Responses may include random latency, occasional 503 failures, and product prices or availability may change on the configured mutation interval.',
  })
  @ApiOkResponse({
    type: ProviderCProductResponseDto,
    isArray: true,
    description:
      'Provider C catalog snapshot with cents-based pricing, numeric availability, and epoch timestamps.',
  })
  @ApiServiceUnavailableResponse({
    description:
      'Transient simulated upstream failure. This endpoint intentionally returns occasional 503 responses.',
  })
  async getCatalog(): Promise<ProviderCProductResponseDto[]> {
    if (this.registryService.shouldSimulateFailure()) {
      throw new ServiceUnavailableException('Provider C is temporarily unavailable');
    }

    await this.registryService.simulateDelay();

    return this.registryService
      .getProductsSnapshot(ProviderName.PROVIDER_C)
      .map((product) => new ProviderCProductResponseDto(product));
  }
}
