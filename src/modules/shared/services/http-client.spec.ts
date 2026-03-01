import { ProviderName } from '@core/enums';
import { HttpClient } from './http-client';

describe('HttpClient', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('returns the response on the first successful attempt', async () => {
    const client = new HttpClient({
      baseUrl: 'https://provider-a.example.com/api/',
      label: ProviderName.PROVIDER_A,
      timeoutMs: 1000,
      retries: 2,
      backoffMs: 100,
    });
    const payload = [{ id: '1' }];
    const response = new Response(JSON.stringify(payload), { status: 200 });

    jest.spyOn(global, 'fetch').mockResolvedValue(response);

    await expect(client.request<{ id: string }[]>('products')).resolves.toEqual(payload);
    expect(global.fetch).toHaveBeenCalledWith('https://provider-a.example.com/api/products', {
      signal: expect.any(AbortSignal),
    });
  });

  it('retries on 503 and succeeds on the next attempt', async () => {
    jest.useFakeTimers();

    const client = new HttpClient({
      baseUrl: 'https://provider-a.example.com',
      label: ProviderName.PROVIDER_A,
      timeoutMs: 1000,
      retries: 2,
      backoffMs: 100,
    });
    const warnSpy = jest.spyOn((client as any).logger, 'warn').mockImplementation();
    const payload = [{ id: '1' }];
    const response = new Response(JSON.stringify(payload), { status: 200 });

    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response('unavailable', { status: 503 }))
      .mockResolvedValueOnce(response);

    const promise = client.request();

    await jest.runOnlyPendingTimersAsync();

    await expect(promise).resolves.toEqual(payload);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('throws after retries are exhausted', async () => {
    jest.useFakeTimers();

    const client = new HttpClient({
      baseUrl: 'https://provider-a.example.com',
      label: ProviderName.PROVIDER_A,
      timeoutMs: 1000,
      retries: 2,
      backoffMs: 100,
    });

    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('still failing', { status: 503 }));

    const promise = client.request();
    const expectation = expect(promise).rejects.toThrow(
      `${ProviderName.PROVIDER_A} request failed with status 503`,
    );

    await jest.runOnlyPendingTimersAsync();
    await jest.runOnlyPendingTimersAsync();

    await expectation;
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('does not retry on 4xx responses', async () => {
    const client = new HttpClient({
      baseUrl: 'https://provider-a.example.com',
      label: ProviderName.PROVIDER_A,
      timeoutMs: 1000,
      retries: 3,
      backoffMs: 100,
    });

    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('bad request', { status: 400 }));

    await expect(client.request()).rejects.toThrow(
      `${ProviderName.PROVIDER_A} request failed with status 400`,
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('throws on timeout', async () => {
    jest.useFakeTimers();

    const client = new HttpClient({
      baseUrl: 'https://provider-a.example.com',
      label: ProviderName.PROVIDER_A,
      timeoutMs: 1000,
      retries: 0,
      backoffMs: 100,
    });

    jest.spyOn(global, 'fetch').mockImplementation(
      (_input: string | URL | globalThis.Request, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          const signal = init?.signal as AbortSignal;
          signal.addEventListener('abort', () => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }),
    );

    const promise = client.request();
    const expectation = expect(promise).rejects.toThrow(
      `${ProviderName.PROVIDER_A} request timed out after 1000ms`,
    );

    await jest.advanceTimersByTimeAsync(1000);

    await expectation;
  });

  it('retries on connection errors', async () => {
    jest.useFakeTimers();

    const client = new HttpClient({
      baseUrl: 'https://provider-a.example.com',
      label: ProviderName.PROVIDER_A,
      timeoutMs: 1000,
      retries: 1,
      backoffMs: 100,
    });
    const connectionError = Object.assign(new Error('connect refused'), {
      code: 'ECONNREFUSED',
    });
    const payload = [{ id: '1' }];
    const response = new Response(JSON.stringify(payload), { status: 200 });

    jest
      .spyOn(global, 'fetch')
      .mockRejectedValueOnce(connectionError)
      .mockResolvedValueOnce(response);

    const promise = client.request();

    await jest.runOnlyPendingTimersAsync();

    await expect(promise).resolves.toEqual(payload);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('uses exponential backoff with jitter', async () => {
    const client = new HttpClient({
      baseUrl: 'https://provider-a.example.com',
      label: ProviderName.PROVIDER_A,
      timeoutMs: 1000,
      retries: 2,
      backoffMs: 100,
    });
    const sleepSpy = jest
      .spyOn(client as any, 'sleep')
      .mockImplementation(async (_ms: number): Promise<void> => Promise.resolve());

    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response('unavailable', { status: 503 }))
      .mockResolvedValueOnce(new Response('still unavailable', { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: '1' }]), { status: 200 }));

    await client.request();

    expect(sleepSpy).toHaveBeenCalledTimes(2);
    // attempt 1: base=100, jitter ±50 → range [50, 150]
    expect(sleepSpy.mock.calls[0][0]).toBeGreaterThanOrEqual(50);
    expect(sleepSpy.mock.calls[0][0]).toBeLessThanOrEqual(150);
    // attempt 2: base=200, jitter ±50 → range [150, 250]
    expect(sleepSpy.mock.calls[1][0]).toBeGreaterThanOrEqual(150);
    expect(sleepSpy.mock.calls[1][0]).toBeLessThanOrEqual(250);
  });

  it('retries on 429 rate limit responses', async () => {
    jest.useFakeTimers();

    const client = new HttpClient({
      baseUrl: 'https://provider-a.example.com',
      label: ProviderName.PROVIDER_A,
      timeoutMs: 1000,
      retries: 1,
      backoffMs: 100,
    });
    const payload = [{ id: '1' }];

    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response('rate limited', { status: 429 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(payload), { status: 200 }));

    const promise = client.request();

    await jest.runOnlyPendingTimersAsync();

    await expect(promise).resolves.toEqual(payload);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
