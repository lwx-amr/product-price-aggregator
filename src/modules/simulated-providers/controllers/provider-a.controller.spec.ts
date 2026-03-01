import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProviderAProductResponseDto } from '../dto';
import { ProviderName } from '../enums';
import { SimulatedProviderRegistryService } from '../services/simulated-provider-registry.service';
import { ProviderAController } from './provider-a.controller';

describe('ProviderAController', () => {
  let controller: ProviderAController;
  let module: TestingModule;
  let registryService: SimulatedProviderRegistryService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [ProviderAController],
      providers: [SimulatedProviderRegistryService, mockConfigProvider()],
    }).compile();

    controller = module.get<ProviderAController>(ProviderAController);
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

  describe('getProducts', () => {
    const mockProducts = [
      {
        id: 'prov-a-nestjs-masterclass',
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

      await expect(controller.getProducts()).rejects.toThrow(ServiceUnavailableException);
      expect(registryService.simulateDelay).not.toHaveBeenCalled();
      expect(registryService.getProductsSnapshot).not.toHaveBeenCalled();
    });

    it('gets the provider A snapshot after simulating delay', async () => {
      await controller.getProducts();

      expect(registryService.shouldSimulateFailure).toHaveBeenCalledTimes(1);
      expect(registryService.simulateDelay).toHaveBeenCalledTimes(1);
      expect(registryService.getProductsSnapshot).toHaveBeenCalledWith(ProviderName.PROVIDER_A);
    });

    it('returns provider A products mapped to response DTOs', async () => {
      const response = await controller.getProducts();

      expect(response).toEqual(mockProducts.map((product) => new ProviderAProductResponseDto(product)));
    });
  });
});
