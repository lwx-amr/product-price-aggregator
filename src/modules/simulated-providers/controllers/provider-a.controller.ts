import { Public } from '@core/decorators';
import { ProviderName } from '@core/enums';
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ProviderAProductResponseDto } from '../dto';
import { SimulatedProviderRegistryService } from '../services/simulated-provider-registry.service';

@ApiTags('Simulated Providers')
@Public()
@SkipThrottle()
@Controller('sim/providers/a')
export class ProviderAController {
  constructor(private readonly registryService: SimulatedProviderRegistryService) {}

  @Get('products')
  @ApiOperation({
    summary: 'Get Provider A simulated products',
    description:
      'Returns the current in-memory snapshot for Provider A. Responses may include random latency, occasional 503 failures, and product prices or availability may change on the configured mutation interval.',
  })
  @ApiOkResponse({
    type: ProviderAProductResponseDto,
    isArray: true,
    description:
      'Provider A product snapshot with ISO timestamps, current price, and availability.',
  })
  @ApiServiceUnavailableResponse({
    description:
      'Transient simulated upstream failure. This endpoint intentionally returns occasional 503 responses.',
  })
  async getProducts(): Promise<ProviderAProductResponseDto[]> {
    if (this.registryService.shouldSimulateFailure()) {
      throw new ServiceUnavailableException('Provider A is temporarily unavailable');
    }

    await this.registryService.simulateDelay();

    return this.registryService
      .getProductsSnapshot(ProviderName.PROVIDER_A)
      .map((product) => new ProviderAProductResponseDto(product));
  }
}
