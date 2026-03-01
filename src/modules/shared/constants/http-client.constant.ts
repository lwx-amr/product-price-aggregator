export const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

export const TRANSIENT_ERROR_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'EAI_AGAIN',
]);
