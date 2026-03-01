import type { Environment } from '@config';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { HttpClientOptions } from '../interfaces';
import { HttpClient } from './http-client';

@Injectable()
export class HttpClientFactory {
  constructor(private readonly configService: ConfigService<Environment, true>) {}

  create(options: Pick<HttpClientOptions, 'baseUrl' | 'label'>): HttpClient {
    return new HttpClient({
      ...options,
      timeoutMs: this.configService.get('PROVIDER_TIMEOUT_MS', { infer: true }),
      retries: this.configService.get('RETRY_COUNT', { infer: true }),
      backoffMs: this.configService.get('RETRY_BACKOFF_MS', { infer: true }),
    });
  }
}
