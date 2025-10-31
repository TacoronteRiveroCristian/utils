import { RateLimitError } from './errors.js';
import { getLogger } from './logger.js';

// Token Bucket implementation for QPS limiting
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly capacity: number,
    private readonly refillRate: number // tokens per second
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  // Try to consume tokens
  async consume(tokens = 1): Promise<void> {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return;
    }

    // Calculate wait time
    const deficit = tokens - this.tokens;
    const waitMs = (deficit / this.refillRate) * 1000;

    throw new RateLimitError('Rate limit exceeded', waitMs);
  }

  // Refill tokens based on time elapsed
  private refill(): void {
    const now = Date.now();
    const elapsedMs = now - this.lastRefill;
    const elapsedSeconds = elapsedMs / 1000;

    const tokensToAdd = elapsedSeconds * this.refillRate;

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  // Get current token count
  getTokens(): number {
    this.refill();
    return this.tokens;
  }

  // Reset bucket
  reset(): void {
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }
}

// Semaphore for limiting concurrent operations
export class Semaphore {
  private permits: number;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly maxPermits: number) {
    this.permits = maxPermits;
  }

  // Acquire permit
  async acquire(): Promise<() => void> {
    if (this.permits > 0) {
      this.permits--;
      return () => this.release();
    }

    // Wait for permit
    return new Promise<() => void>((resolve) => {
      this.queue.push(() => {
        resolve(() => this.release());
      });
    });
  }

  // Release permit
  private release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) {
        next();
      }
    } else {
      this.permits++;
    }
  }

  // Get available permits
  getAvailable(): number {
    return this.permits;
  }

  // Get queue length
  getQueueLength(): number {
    return this.queue.length;
  }
}

// Combined rate limiter
export class RateLimiter {
  private tokenBucket: TokenBucket;
  private semaphore: Semaphore;
  private requestCount = 0;
  private errorCount = 0;

  constructor(
    private readonly qps: number,
    private readonly maxConcurrent: number
  ) {
    this.tokenBucket = new TokenBucket(qps, qps);
    this.semaphore = new Semaphore(maxConcurrent);
  }

  // Execute function with rate limiting
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const logger = getLogger();

    // Check QPS limit
    try {
      await this.tokenBucket.consume(1);
    } catch (error) {
      this.errorCount++;
      logger.warn({
        type: 'rate_limit_qps',
        qps: this.qps,
        retryAfter: error instanceof RateLimitError ? error.retryAfter : undefined,
      });
      throw error;
    }

    // Acquire concurrency permit
    const release = await this.semaphore.acquire();

    try {
      this.requestCount++;
      const result = await fn();
      return result;
    } finally {
      release();
    }
  }

  // Get statistics
  getStats(): {
    qps: number;
    maxConcurrent: number;
    currentConcurrent: number;
    queueLength: number;
    totalRequests: number;
    totalErrors: number;
    availableTokens: number;
  } {
    return {
      qps: this.qps,
      maxConcurrent: this.maxConcurrent,
      currentConcurrent: this.maxConcurrent - this.semaphore.getAvailable(),
      queueLength: this.semaphore.getQueueLength(),
      totalRequests: this.requestCount,
      totalErrors: this.errorCount,
      availableTokens: Math.floor(this.tokenBucket.getTokens()),
    };
  }

  // Log statistics
  logStats(): void {
    const logger = getLogger();
    logger.debug({
      type: 'rate_limiter_stats',
      ...this.getStats(),
    });
  }

  // Reset statistics
  reset(): void {
    this.tokenBucket.reset();
    this.requestCount = 0;
    this.errorCount = 0;
  }
}
