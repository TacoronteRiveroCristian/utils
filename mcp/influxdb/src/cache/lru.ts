import { LRUCache } from 'lru-cache';
import type { CacheEntry } from '../influx/types.js';
import { getLogger } from '../utils/logger.js';

export class TTLCache<T> {
  private cache: LRUCache<string, CacheEntry<T>>;
  private ttlMs: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize: number, ttlSeconds: number) {
    this.ttlMs = ttlSeconds * 1000;
    this.cache = new LRUCache<string, CacheEntry<T>>({
      max: maxSize,
      ttl: this.ttlMs,
      updateAgeOnGet: true,
      updateAgeOnHas: false,
    });
  }

  // Get value from cache
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check if TTL expired
    const now = Date.now();
    if (now - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    this.hits++;
    return entry.data;
  }

  // Set value in cache
  set(key: string, value: T): void {
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
    };

    this.cache.set(key, entry);
  }

  // Check if key exists and is valid
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    const now = Date.now();
    if (now - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Delete key
  delete(key: string): void {
    this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  // Get cache statistics
  getStats(): {
    size: number;
    maxSize: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? this.hits / total : 0;

    return {
      size: this.cache.size,
      maxSize: this.cache.max,
      hits: this.hits,
      misses: this.misses,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  // Log cache stats
  logStats(): void {
    const logger = getLogger();
    const stats = this.getStats();

    logger.debug({
      type: 'cache_stats',
      ...stats,
    });
  }

  // Evict expired entries
  evictExpired(): number {
    const now = Date.now();
    let evicted = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttlMs) {
        this.cache.delete(key);
        evicted++;
      }
    }

    return evicted;
  }
}

// Cache key builders
export function buildMetadataKey(type: string, db?: string, measurement?: string): string {
  const parts = ['meta', type];
  if (db) parts.push(db);
  if (measurement) parts.push(measurement);
  return parts.join(':');
}

export function buildQueryKey(query: string, db: string): string {
  // Hash the query for shorter keys
  const hash = Buffer.from(query).toString('base64').substring(0, 32);
  return `query:${db}:${hash}`;
}
