import type { AGGREGATION_FUNCTIONS, FILL_OPTIONS, QUERY_STRATEGIES } from '../config/constants.js';

// InfluxDB response types
export interface InfluxDBResult {
  statement_id?: number;
  series?: InfluxDBSeries[];
  error?: string;
}

export interface InfluxDBSeries {
  name: string;
  tags?: Record<string, string>;
  columns: string[];
  values: unknown[][];
}

export interface InfluxDBResponse {
  results: InfluxDBResult[];
}

// Query building types
export type AggregationFunction = (typeof AGGREGATION_FUNCTIONS)[number];
export type FillOption = (typeof FILL_OPTIONS)[number] | number;
export type QueryStrategy = (typeof QUERY_STRATEGIES)[number];

export interface WhereClause {
  time?: {
    from: string;
    to: string;
  };
  tags?: Record<
    string,
    | string
    | {
        op: '=' | '!=' | '=~' | '!~';
        value: string;
      }
  >;
}

export interface QueryOptions {
  db: string;
  measurement: string;
  fields: string[] | '*';
  where?: WhereClause;
  agg?: AggregationFunction;
  percentile?: number;
  group_by_time?: string;
  group_by_tags?: string[];
  fill?: FillOption;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  chunk_size?: number;
  tz?: string;
}

export interface QueryPlan {
  strategy: QueryStrategy;
  estimatedPoints: number;
  needsDownsampling: boolean;
  window?: string;
  query: string;
}

// Time series data types
export interface TimeSeriesPoint {
  t: string; // ISO 8601 timestamp
  v: number;
}

export interface TimeSeriesResult {
  columns: string[];
  rows: unknown[][];
  stats: {
    scanned_points?: number;
    window?: string | null;
    duration_ms: number;
    partial?: boolean;
  };
  next_cursor?: string | null;
}

export interface LastValueResult {
  rows: Array<{
    group?: Record<string, string>;
    time: string;
    value: number | null;
  }>;
}

// Metadata types
export interface FieldInfo {
  name: string;
  type: 'float' | 'integer' | 'boolean' | 'string';
}

export interface RetentionPolicy {
  name: string;
  duration: string;
  replication: number;
  default: boolean;
}

// Feature extraction types
export interface FeatureResult {
  global?: Record<string, number>;
  rolling?: Array<{
    window_start: string;
    window_end: string;
    values: Record<string, number>;
  }>;
}

// HTTP client types
export interface InfluxDBClientConfig {
  protocol: 'http' | 'https';
  host: string;
  port: number;
  username: string;
  password: string;
  timeout: number;
  maxConnections: number;
  retryMax: number;
  retryDelay: number;
}

// Pagination types
export interface PaginationCursor {
  db: string;
  measurement: string;
  offset: number;
  timeAnchor?: string;
  hash: string; // hash of query params for validation
}

// Cache types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
