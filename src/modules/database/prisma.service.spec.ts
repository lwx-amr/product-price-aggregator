import { NodeEnvironment } from '@core/enums';
import type { PinoLogger } from 'nestjs-pino';
import { createPinoInfoLogger, createPrismaConfigService } from '@test/helpers/prisma-service.helper';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
  });

  it('connects and logs on module init in development mode', async () => {
    process.env.NODE_ENV = NodeEnvironment.DEVELOPMENT;
    const logger = createPinoInfoLogger();
    const service = new PrismaService(createPrismaConfigService(), logger as PinoLogger);
    const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();

    await service.onModuleInit();

    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith('Database connected');
  });

  it('disconnects and logs on module destroy outside development mode', async () => {
    process.env.NODE_ENV = NodeEnvironment.TEST;
    const logger = createPinoInfoLogger();
    const service = new PrismaService(createPrismaConfigService(), logger as PinoLogger);
    const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue();

    await service.onModuleDestroy();

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith('Database disconnected');
  });
});
