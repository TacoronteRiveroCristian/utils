import type { QueryOptions, AggregationFunction, FillOption } from './types.js';
import {
  validateMeasurement,
  validateField,
  validateTag,
  validateTagValue,
  validateTimeWindow,
  validateLimit,
} from './query-validator.js';
import { parseTime, toInfluxTime } from '../utils/time.js';

export class QueryBuilder {
  private selectClauses: string[] = [];
  private fromClause = '';
  private whereClauses: string[] = [];
  private groupByClauses: string[] = [];
  private fillClause = '';
  private orderClause = '';
  private limitClause = '';
  private offsetClause = '';
  private tzClause = '';

  // Build SELECT clause
  select(fields: string[] | '*', agg?: AggregationFunction, percentile?: number): this {
    if (fields === '*') {
      this.selectClauses = agg ? [`${agg.toUpperCase()}(*)` ] : ['*'];
      return this;
    }

    for (const field of fields) {
      const validatedField = validateField(field);

      if (agg) {
        if (agg === 'percentile' && percentile !== undefined) {
          this.selectClauses.push(`PERCENTILE(${validatedField}, ${percentile})`);
        } else {
          this.selectClauses.push(`${agg.toUpperCase()}(${validatedField})`);
        }
      } else {
        this.selectClauses.push(validatedField);
      }
    }

    return this;
  }

  // Build FROM clause
  from(measurement: string): this {
    this.fromClause = validateMeasurement(measurement);
    return this;
  }

  // Add time range to WHERE
  timeRange(from: string, to: string, tz = 'UTC'): this {
    const fromDate = parseTime(from);
    const toDate = parseTime(to);

    const fromStr = toInfluxTime(fromDate, tz);
    const toStr = toInfluxTime(toDate, tz);

    this.whereClauses.push(`time >= '${fromStr}'`);
    this.whereClauses.push(`time < '${toStr}'`);

    return this;
  }

  // Add tag filter to WHERE
  tag(name: string, value: string | { op: '=' | '!=' | '=~' | '!~'; value: string }): this {
    const validatedTag = validateTag(name);

    if (typeof value === 'string') {
      const validatedValue = validateTagValue(value);
      this.whereClauses.push(`${validatedTag} = ${validatedValue}`);
    } else {
      // For regex operators, value should be like /pattern/
      if (value.op === '=~' || value.op === '!~') {
        this.whereClauses.push(`${validatedTag} ${value.op} ${value.value}`);
      } else {
        const validatedValue = validateTagValue(value.value);
        this.whereClauses.push(`${validatedTag} ${value.op} ${validatedValue}`);
      }
    }

    return this;
  }

  // Add GROUP BY time clause
  groupByTime(window: string, tz?: string): this {
    validateTimeWindow(window);

    if (tz) {
      this.groupByClauses.push(`time(${window}, '${tz}')`);
    } else {
      this.groupByClauses.push(`time(${window})`);
    }

    return this;
  }

  // Add GROUP BY tags clause
  groupByTags(tags: string[]): this {
    for (const tag of tags) {
      const validatedTag = validateTag(tag);
      this.groupByClauses.push(validatedTag);
    }

    return this;
  }

  // Add FILL clause
  fill(option: FillOption): this {
    if (typeof option === 'number') {
      this.fillClause = `fill(${option})`;
    } else {
      this.fillClause = `fill(${option})`;
    }

    return this;
  }

  // Add ORDER BY clause
  orderBy(direction: 'asc' | 'desc' = 'asc'): this {
    this.orderClause = `ORDER BY time ${direction.toUpperCase()}`;
    return this;
  }

  // Add LIMIT clause
  limit(value: number, maxLimit: number): this {
    validateLimit(value, maxLimit);
    this.limitClause = `LIMIT ${value}`;
    return this;
  }

  // Add OFFSET clause
  offset(value: number): this {
    if (value > 0) {
      this.offsetClause = `OFFSET ${value}`;
    }
    return this;
  }

  // Add TZ clause (legacy, use groupByTime with tz instead)
  tz(timezone: string): this {
    this.tzClause = `tz('${timezone}')`;
    return this;
  }

  // Build final query
  build(): string {
    if (this.selectClauses.length === 0) {
      throw new Error('SELECT clause is required');
    }

    if (!this.fromClause) {
      throw new Error('FROM clause is required');
    }

    const parts: string[] = [];

    // SELECT
    parts.push(`SELECT ${this.selectClauses.join(', ')}`);

    // FROM
    parts.push(`FROM ${this.fromClause}`);

    // WHERE
    if (this.whereClauses.length > 0) {
      parts.push(`WHERE ${this.whereClauses.join(' AND ')}`);
    }

    // GROUP BY
    if (this.groupByClauses.length > 0) {
      parts.push(`GROUP BY ${this.groupByClauses.join(', ')}`);
    }

    // FILL
    if (this.fillClause) {
      parts.push(this.fillClause);
    }

    // ORDER BY
    if (this.orderClause) {
      parts.push(this.orderClause);
    }

    // LIMIT
    if (this.limitClause) {
      parts.push(this.limitClause);
    }

    // OFFSET
    if (this.offsetClause) {
      parts.push(this.offsetClause);
    }

    // TZ
    if (this.tzClause) {
      parts.push(this.tzClause);
    }

    return parts.join(' ');
  }

  // Reset builder
  reset(): this {
    this.selectClauses = [];
    this.fromClause = '';
    this.whereClauses = [];
    this.groupByClauses = [];
    this.fillClause = '';
    this.orderClause = '';
    this.limitClause = '';
    this.offsetClause = '';
    this.tzClause = '';
    return this;
  }
}

// Helper function to build query from options
export function buildQueryFromOptions(options: QueryOptions, maxLimit: number): string {
  const builder = new QueryBuilder();

  // SELECT
  builder.select(options.fields, options.agg, options.percentile);

  // FROM
  builder.from(options.measurement);

  // WHERE - time range
  if (options.where?.time) {
    builder.timeRange(options.where.time.from, options.where.time.to, options.tz);
  }

  // WHERE - tags
  if (options.where?.tags) {
    for (const [tagName, tagValue] of Object.entries(options.where.tags)) {
      builder.tag(tagName, tagValue);
    }
  }

  // GROUP BY
  if (options.group_by_time) {
    builder.groupByTime(options.group_by_time, options.tz);
  }

  if (options.group_by_tags && options.group_by_tags.length > 0) {
    builder.groupByTags(options.group_by_tags);
  }

  // FILL
  if (options.fill) {
    builder.fill(options.fill);
  }

  // ORDER BY
  if (options.order) {
    builder.orderBy(options.order);
  }

  // LIMIT
  if (options.limit) {
    builder.limit(options.limit, maxLimit);
  }

  // OFFSET
  if (options.offset) {
    builder.offset(options.offset);
  }

  return builder.build();
}

// Build LAST() query
export function buildLastQuery(
  measurement: string,
  field: string,
  tags?: Record<string, string>,
  groupByTags?: string[]
): string {
  const builder = new QueryBuilder();

  // SELECT LAST(field)
  const validatedField = validateField(field);
  (builder as any).selectClauses.push(`LAST(${validatedField})`);

  // FROM
  builder.from(measurement);

  // WHERE - tags
  if (tags) {
    for (const [tagName, tagValue] of Object.entries(tags)) {
      builder.tag(tagName, tagValue);
    }
  }

  // GROUP BY tags
  if (groupByTags && groupByTags.length > 0) {
    builder.groupByTags(groupByTags);
  }

  return builder.build();
}
