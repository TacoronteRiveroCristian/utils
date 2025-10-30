import type { InfluxDBClient } from '@/influx/client';
import type { FieldInfo, RetentionPolicy } from '@/influx/types';
import { isDatabaseAllowed } from '@/config/env';
import { DatabaseNotAllowedError } from '@/utils/errors';
import type { TTLCache } from '@/cache/lru';
import { buildMetadataKey } from '@/cache/lru';

export class MetadataTools {
  constructor(
    private readonly client: InfluxDBClient,
    private readonly cache: TTLCache<unknown>
  ) {}

  // List all databases
  async listDatabases(): Promise<{ databases: string[] }> {
    const cacheKey = buildMetadataKey('databases');

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached as { databases: string[] };
    }

    // Execute query
    const response = await this.client.query('SHOW DATABASES', '');

    const databases: string[] = [];

    if (response.results[0]?.series) {
      for (const series of response.results[0].series) {
        for (const row of series.values) {
          const dbName = row[0] as string;

          // Filter by whitelist
          if (isDatabaseAllowed(dbName)) {
            databases.push(dbName);
          }
        }
      }
    }

    const result = { databases };

    // Cache result
    this.cache.set(cacheKey, result);

    return result;
  }

  // List measurements in a database
  async listMeasurements(
    db: string,
    match?: string
  ): Promise<{ measurements: string[] }> {
    // Check database permission
    if (!isDatabaseAllowed(db)) {
      throw new DatabaseNotAllowedError(db);
    }

    const cacheKey = buildMetadataKey('measurements', db, match);

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached as { measurements: string[] };
    }

    // Build query
    let query = 'SHOW MEASUREMENTS';
    if (match) {
      query += ` WITH MEASUREMENT =~ ${match}`;
    }

    // Execute query
    const response = await this.client.query(query, db);

    const measurements: string[] = [];

    if (response.results[0]?.series) {
      for (const series of response.results[0].series) {
        for (const row of series.values) {
          measurements.push(row[0] as string);
        }
      }
    }

    const result = { measurements };

    // Cache result
    this.cache.set(cacheKey, result);

    return result;
  }

  // List fields in a measurement
  async listFields(db: string, measurement: string): Promise<{ fields: FieldInfo[] }> {
    // Check database permission
    if (!isDatabaseAllowed(db)) {
      throw new DatabaseNotAllowedError(db);
    }

    const cacheKey = buildMetadataKey('fields', db, measurement);

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached as { fields: FieldInfo[] };
    }

    // Build query
    const query = `SHOW FIELD KEYS FROM "${measurement}"`;

    // Execute query
    const response = await this.client.query(query, db);

    const fields: FieldInfo[] = [];

    if (response.results[0]?.series) {
      for (const series of response.results[0].series) {
        for (const row of series.values) {
          const fieldName = row[0] as string;
          const fieldType = row[1] as 'float' | 'integer' | 'boolean' | 'string';

          fields.push({
            name: fieldName,
            type: fieldType,
          });
        }
      }
    }

    const result = { fields };

    // Cache result
    this.cache.set(cacheKey, result);

    return result;
  }

  // List tags in a measurement
  async listTags(db: string, measurement: string): Promise<{ tags: string[] }> {
    // Check database permission
    if (!isDatabaseAllowed(db)) {
      throw new DatabaseNotAllowedError(db);
    }

    const cacheKey = buildMetadataKey('tags', db, measurement);

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached as { tags: string[] };
    }

    // Build query
    const query = `SHOW TAG KEYS FROM "${measurement}"`;

    // Execute query
    const response = await this.client.query(query, db);

    const tags: string[] = [];

    if (response.results[0]?.series) {
      for (const series of response.results[0].series) {
        for (const row of series.values) {
          tags.push(row[0] as string);
        }
      }
    }

    const result = { tags };

    // Cache result
    this.cache.set(cacheKey, result);

    return result;
  }

  // List retention policies in a database
  async retentionPolicies(db: string): Promise<{ rps: RetentionPolicy[] }> {
    // Check database permission
    if (!isDatabaseAllowed(db)) {
      throw new DatabaseNotAllowedError(db);
    }

    const cacheKey = buildMetadataKey('retention_policies', db);

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached as { rps: RetentionPolicy[] };
    }

    // Build query
    const query = `SHOW RETENTION POLICIES ON "${db}"`;

    // Execute query
    const response = await this.client.query(query, '');

    const rps: RetentionPolicy[] = [];

    if (response.results[0]?.series) {
      for (const series of response.results[0].series) {
        for (const row of series.values) {
          // Columns: name, duration, shardGroupDuration, replicaN, default
          const name = row[0] as string;
          const duration = row[1] as string;
          const replication = row[3] as number;
          const isDefault = row[4] as boolean;

          rps.push({
            name,
            duration,
            replication,
            default: isDefault,
          });
        }
      }
    }

    const result = { rps };

    // Cache result
    this.cache.set(cacheKey, result);

    return result;
  }
}
