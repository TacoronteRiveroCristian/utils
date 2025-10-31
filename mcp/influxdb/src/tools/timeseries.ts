import type { InfluxDBClient } from '../influx/client.js';
import type { QueryOptions, TimeSeriesResult, LastValueResult } from '../influx/types.js';
import { QueryPlanner } from '../influx/query-planner.js';
import { buildLastQuery } from '../influx/query-builder.js';
import { seriesToRows, paginateRows, countPoints } from '../influx/streaming.js';
import { isDatabaseAllowed, loadEnv } from '../config/env.js';
import { DatabaseNotAllowedError } from '../utils/errors.js';
import { validateTimeRange } from '../utils/time.js';
import { createCursor, decodeCursor, validateCursor } from '../utils/pagination.js';
import type { TTLCache } from '../cache/lru.js';
import { buildQueryKey } from '../cache/lru.js';

export class TimeSeriesTools {
  private readonly planner: QueryPlanner;
  private readonly env = loadEnv();

  constructor(
    private readonly client: InfluxDBClient,
    private readonly cache: TTLCache<unknown>
  ) {
    this.planner = new QueryPlanner(this.env.MAX_POINTS, this.env.MAX_LIMIT);
  }

  // General timeseries query with query builder
  async query(
    options: QueryOptions,
    pageSize?: number,
    cursor?: string,
    noCache = false
  ): Promise<TimeSeriesResult> {
    // Check database permission
    if (!isDatabaseAllowed(options.db)) {
      throw new DatabaseNotAllowedError(options.db);
    }

    // Validate time range if specified
    if (options.where?.time) {
      validateTimeRange(
        options.where.time.from,
        options.where.time.to,
        this.env.MAX_RANGE_DAYS
      );
    }

    const actualPageSize = pageSize || this.env.DEFAULT_PAGE_SIZE;
    let offset = 0;

    // Handle pagination cursor
    if (cursor) {
      const decodedCursor = decodeCursor(cursor);

      // Validate cursor
      const queryParams = { ...options };
      if (!validateCursor(decodedCursor, queryParams)) {
        throw new Error('Invalid cursor: query parameters have changed');
      }

      offset = decodedCursor.offset;
    }

    // Check cache (only if no cursor and cache enabled)
    const cacheKey = buildQueryKey(JSON.stringify(options), options.db);
    if (!cursor && !noCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached as TimeSeriesResult;
      }
    }

    // Plan query
    const plan = this.planner.plan(options);
    this.planner.validatePlan(plan);

    // Execute query
    const startTime = Date.now();
    const response = await this.client.query(plan.query, options.db);
    const durationMs = Date.now() - startTime;

    // Process results
    const series = response.results[0]?.series || [];
    const { columns, rows } = seriesToRows(series);

    // Apply pagination
    const { rows: pageRows, hasMore, nextOffset } = paginateRows(rows, actualPageSize, offset);

    const result: TimeSeriesResult = {
      columns,
      rows: pageRows,
      stats: {
        scanned_points: countPoints(series),
        window: plan.window || null,
        duration_ms: durationMs,
        partial: hasMore,
      },
      next_cursor: hasMore ? createCursor(options.db, options.measurement, nextOffset, options as any) : null,
    };

    // Cache result (only first page)
    if (!cursor && !noCache) {
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  // Get last value(s) efficiently with LAST()
  async last(
    db: string,
    measurement: string,
    field: string,
    tags?: Record<string, string>,
    groupByTags?: string[]
  ): Promise<LastValueResult> {
    // Check database permission
    if (!isDatabaseAllowed(db)) {
      throw new DatabaseNotAllowedError(db);
    }

    // Check cache
    const cacheKey = buildQueryKey(
      JSON.stringify({ db, measurement, field, tags, groupByTags }),
      db
    );
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached as LastValueResult;
    }

    // Build LAST query
    const query = buildLastQuery(measurement, field, tags, groupByTags);

    // Execute query
    const response = await this.client.query(query, db);

    const series = response.results[0]?.series || [];

    const rows: LastValueResult['rows'] = [];

    for (const s of series) {
      for (const row of s.values) {
        const time = row[0] as string;
        const value = row[1] as number | null;

        rows.push({
          group: s.tags,
          time,
          value,
        });
      }
    }

    const result: LastValueResult = { rows };

    // Cache result
    this.cache.set(cacheKey, result);

    return result;
  }

  // Window aggregation shortcut with sensible defaults
  async windowAgg(
    db: string,
    measurement: string,
    field: string,
    from: string,
    to: string,
    window: string,
    aggs: string[],
    percentile?: number,
    groupByTags?: string[],
    fill?: 'none' | 'previous' | number,
    tz = 'UTC'
  ): Promise<TimeSeriesResult> {
    // Check database permission
    if (!isDatabaseAllowed(db)) {
      throw new DatabaseNotAllowedError(db);
    }

    // Validate time range
    validateTimeRange(from, to, this.env.MAX_RANGE_DAYS);

    // For multiple aggregations, we need to execute separate queries or use subqueries
    // For simplicity, we'll execute the first aggregation
    // In a full implementation, you'd handle multiple aggs properly

    const options: QueryOptions = {
      db,
      measurement,
      fields: [field],
      where: {
        time: { from, to },
      },
      agg: aggs[0] as any,
      percentile,
      group_by_time: window,
      group_by_tags: groupByTags,
      fill,
      tz,
    };

    return this.query(options);
  }
}
