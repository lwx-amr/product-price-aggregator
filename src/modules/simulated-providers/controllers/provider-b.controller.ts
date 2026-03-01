import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProviderBProductResponseDto } from '../dto';
import { ProviderName } from '../enums';
import { SimulatedProviderRegistryService } from '../services/simulated-provider-registry.service';

@ApiTags('Simulated Providers')
@Controller('sim/providers/b')
export class ProviderBController {
  constructor(private readonly registryService: SimulatedProviderRegistryService) {}

  @Get('items')
  @ApiOperation({
    summary: 'Get Provider B simulated items',
    description:
      'Returns the current in-memory snapshot for Provider B. Responses may include random latency, occasional 503 failures, and product prices or availability may change on the configured mutation interval.',
  })
  @ApiOkResponse({
    type: ProviderBProductResponseDto,
    isArray: true,
    description:
      'Provider B item snapshot with nested cost payload, stock status, and ISO timestamps.',
  })
  @ApiServiceUnavailableResponse({
    description:
      'Transient simulated upstream failure. This endpoint intentionally returns occasional 503 responses.',
  })
  async getItems(): Promise<ProviderBProductResponseDto[]> {
    if (this.registryService.shouldSimulateFailure()) {
      throw new ServiceUnavailableException('Provider B is temporarily unavailable');
    }

    await this.registryService.simulateDelay();

    return this.registryService
      .getProductsSnapshot(ProviderName.PROVIDER_B)
      .map((product) => new ProviderBProductResponseDto(product));
  }
}
