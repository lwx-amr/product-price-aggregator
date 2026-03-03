import pino from 'pino';
import { RETRYABLE_STATUSES, TRANSIENT_ERROR_CODES } from '../constants';
import { HttpClientOptions } from '../interfaces';

export class HttpClient {
  private readonly logger = pino({ name: HttpClient.name });

  constructor(private readonly options: HttpClientOptions) {}

  async request<T>(path = ''): Promise<T> {
    const url = this.buildUrl(path);
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.options.retries + 1; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url);

        if (response.ok) {
          return (await response.json()) as T;
        }

        lastError = new Error(
          `${this.options.label} request failed with status ${response.status}`,
        );

        if (!RETRYABLE_STATUSES.has(response.status)) {
          throw lastError;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (!this.isRetryable(lastError)) {
          throw lastError;
        }
      }

      if (attempt <= this.options.retries) {
        const delay = this.getBackoffDelay(attempt);
        this.logger.warn(
          {
            label: this.options.label,
            attempt,
            retries: this.options.retries,
            delayMs: delay,
            errorMessage: lastError.message,
          },
          'HTTP client request failed, retrying',
        );
        await this.sleep(delay);
      }
    }

    this.logger.error(
      {
        label: this.options.label,
        attempts: this.options.retries + 1,
        errorMessage: lastError!.message,
      },
      'HTTP client request failed after all retries',
    );
    throw lastError!;
  }

  protected async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private buildUrl(path: string): string {
    return new URL(path, this.options.baseUrl).toString();
  }

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs);

    try {
      return await fetch(url, { signal: controller.signal });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error(
          `${this.options.label} request timed out after ${this.options.timeoutMs}ms`,
        );
        timeoutError.name = 'AbortError';
        throw timeoutError;
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  private getBackoffDelay(attempt: number): number {
    const base = this.options.backoffMs * 2 ** (attempt - 1);
    const jitter = (Math.random() - 0.5) * this.options.backoffMs;
    return Math.max(0, Math.round(base + jitter));
  }

  private isRetryable(error: Error): boolean {
    if (error.name === 'AbortError') {
      return true;
    }

    const code = 'code' in error ? (error as NodeJS.ErrnoException).code : undefined;
    return typeof code === 'string' && TRANSIENT_ERROR_CODES.has(code);
  }
}
