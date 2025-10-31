import { isRetryableError } from './errors.js';
import { getLogger } from './logger.js';

export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: unknown) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  onRetry: () => {},
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt);
  return Math.min(delay, options.maxDelayMs);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const logger = getLogger();

  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if not retryable or max retries reached
      if (!isRetryableError(error) || attempt === opts.maxRetries) {
        throw error;
      }

      const delay = calculateDelay(attempt, opts);

      logger.warn({
        type: 'retry_attempt',
        attempt: attempt + 1,
        maxRetries: opts.maxRetries,
        delayMs: delay,
        error: error instanceof Error ? error.message : String(error),
      });

      opts.onRetry(attempt + 1, error);

      await sleep(delay);
    }
  }

  throw lastError;
}

// Exponential backoff with jitter
export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 500
): Promise<T> {
  return withRetry(fn, {
    maxRetries,
    initialDelayMs: baseDelayMs,
    backoffMultiplier: 2,
    maxDelayMs: 10000,
  });
}
