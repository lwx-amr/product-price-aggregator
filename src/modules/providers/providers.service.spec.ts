import { Test, TestingModule } from '@nestjs/testing';
import { ProvidersService } from './providers.service';

describe('ProvidersService', () => {
  let module: TestingModule;
  let service: ProvidersService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [ProvidersService],
    }).compile();

    service = module.get<ProvidersService>(ProvidersService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  it('slugifies provider product names into canonical keys', () => {
    expect(service.slugify('  NestJS Masterclass  ')).toBe('nestjs-masterclass');
    expect(service.slugify('TypeScript Pro License!')).toBe('typescript-pro-license');
  });

  it('returns parsed dates when the source value is valid', () => {
    const result = service.safeParseDate('2026-02-28T12:00:00.000Z');

    expect(result).toBeInstanceOf(Date);
    expect(result?.toISOString()).toBe('2026-02-28T12:00:00.000Z');
  });

  it('returns null when the source value is invalid', () => {
    expect(service.safeParseDate('not-a-date')).toBeNull();
  });
});
