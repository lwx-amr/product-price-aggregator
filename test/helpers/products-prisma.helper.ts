export interface MockProductsPrismaService {
  provider: {
    upsert: jest.Mock;
  };
  product: {
    count: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    upsert: jest.Mock;
  };
  providerProduct: {
    updateMany: jest.Mock;
  };
  $transaction: jest.Mock;
  providerProductHistory: {
    count: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
  };
}

export interface MockProductsPrismaTransactionClient {
  providerProduct: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  providerProductHistory: {
    count: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
  };
}

export function createMockProductsPrismaService(): MockProductsPrismaService {
  return {
    provider: {
      upsert: jest.fn(),
    },
    product: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    providerProduct: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
    providerProductHistory: {
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };
}

export function createMockProductsPrismaTransactionClient(): MockProductsPrismaTransactionClient {
  return {
    providerProduct: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    providerProductHistory: {
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };
}
