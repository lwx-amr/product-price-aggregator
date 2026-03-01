export interface HttpClientOptions {
  baseUrl: string;
  label: string;
  timeoutMs: number;
  retries: number;
  backoffMs: number;
}
