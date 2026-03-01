import { ProviderName } from '@core/enums';
import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProviderBProductResponseDto } from '../dto';
import { SimulatedProviderRegistryService } from '../services/simulated-provider-registry.service';
import { ProviderBController } from './provider-b.controller';

describe('ProviderBController', () => {
  let controller: ProviderBController;
  let module: TestingModule;
  let registryService: SimulatedProviderRegistryService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [ProviderBController],
      providers: [SimulatedProviderRegistryService, mockConfigProvider()],
    }).compile();

    controller = module.get<ProviderBController>(ProviderBController);
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

  describe('getItems', () => {
    const mockProducts = [
      {
        id: 'prov-b-nestjs-masterclass',
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

      await expect(controller.getItems()).rejects.toThrow(ServiceUnavailableException);
      expect(registryService.simulateDelay).not.toHaveBeenCalled();
      expect(registryService.getProductsSnapshot).not.toHaveBeenCalled();
    });

    it('gets the provider B snapshot after simulating delay', async () => {
      await controller.getItems();

      expect(registryService.shouldSimulateFailure).toHaveBeenCalledTimes(1);
      expect(registryService.simulateDelay).toHaveBeenCalledTimes(1);
      expect(registryService.getProductsSnapshot).toHaveBeenCalledWith(ProviderName.PROVIDER_B);
    });

    it('returns provider B products mapped to response DTOs', async () => {
      const response = await controller.getItems();

      expect(response).toEqual(mockProducts.map((product) => new ProviderBProductResponseDto(product)));
    });
  });
});
