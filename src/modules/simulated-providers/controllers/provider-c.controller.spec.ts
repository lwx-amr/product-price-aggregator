import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProviderCProductResponseDto } from '../dto';
import { ProviderName } from '../enums';
import { SimulatedProviderRegistryService } from '../services/simulated-provider-registry.service';
import { ProviderCController } from './provider-c.controller';

describe('ProviderCController', () => {
  let controller: ProviderCController;
  let module: TestingModule;
  let registryService: SimulatedProviderRegistryService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [ProviderCController],
      providers: [SimulatedProviderRegistryService, mockConfigProvider()],
    }).compile();

    controller = module.get<ProviderCController>(ProviderCController);
    registryService = module.get<SimulatedProviderRegistryService>(SimulatedProviderRegistryService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCatalog', () => {
    const mockProducts = [
      {
        id: 'prov-c-nestjs-masterclass',
        name: 'NestJS Masterclass',
        description: 'Advanced NestJS course for backend engineers.',
        price: 79.99,
        currency: 'USD',
        available: true,
        lastUpdated: 1_700_000_000_000,
      },
    ];

    beforeEach(() => {
      jest.spyOn(registryService, 'shouldSimulateFailure').mockReturnValue(false);
      jest.spyOn(registryService, 'simulateDelay').mockResolvedValue(undefined);
      jest.spyOn(registryService, 'getProductsSnapshot').mockReturnValue(mockProducts);
    });

    it('throws ServiceUnavailableException when the provider is unavailable', async () => {
      jest.spyOn(registryService, 'shouldSimulateFailure').mockReturnValue(true);

      await expect(controller.getCatalog()).rejects.toThrow(ServiceUnavailableException);
      expect(registryService.simulateDelay).not.toHaveBeenCalled();
      expect(registryService.getProductsSnapshot).not.toHaveBeenCalled();
    });

    it('gets the provider C snapshot after simulating delay', async () => {
      await controller.getCatalog();

      expect(registryService.shouldSimulateFailure).toHaveBeenCalledTimes(1);
      expect(registryService.simulateDelay).toHaveBeenCalledTimes(1);
      expect(registryService.getProductsSnapshot).toHaveBeenCalledWith(ProviderName.PROVIDER_C);
    });

    it('returns provider C products mapped to response DTOs', async () => {
      const response = await controller.getCatalog();

      expect(response).toEqual(mockProducts.map((product) => new ProviderCProductResponseDto(product)));
    });
  });
});
