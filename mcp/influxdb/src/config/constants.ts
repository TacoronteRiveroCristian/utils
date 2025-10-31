// InfluxQL keywords that are forbidden (write/DDL operations)
export const FORBIDDEN_KEYWORDS = [
  'INTO',
  'DROP',
  'DELETE',
  'ALTER',
  'CREATE',
  'GRANT',
  'REVOKE',
  'INSERT',
] as const;

// InfluxQL functions allowed for read-only queries
export const ALLOWED_FUNCTIONS = [
  'MEAN',
  'MEDIAN',
  'MIN',
  'MAX',
  'SUM',
  'COUNT',
  'SPREAD',
  'STDDEV',
  'PERCENTILE',
  'FIRST',
  'LAST',
  'DERIVATIVE',
  'NON_NEGATIVE_DERIVATIVE',
  'INTEGRAL',
  'MOVING_AVERAGE',
  'CUMULATIVE_SUM',
  'DIFFERENCE',
  'NON_NEGATIVE_DIFFERENCE',
  'ELAPSED',
  'DISTINCT',
  'MODE',
  'SAMPLE',
  'TOP',
  'BOTTOM',
] as const;

// Aggregation functions
export const AGGREGATION_FUNCTIONS = [
  'mean',
  'median',
  'min',
  'max',
  'sum',
  'count',
  'spread',
  'stddev',
  'percentile',
] as const;

// Fill options for GROUP BY queries
export const FILL_OPTIONS = ['none', 'null', 'previous', 'linear'] as const;

// Time window units
export const TIME_UNITS = ['ns', 'u', 'ms', 's', 'm', 'h', 'd', 'w'] as const;

// Query strategies
export const QUERY_STRATEGIES = ['LAST', 'AGGREGATED', 'RAW', 'DOWNSAMPLED'] as const;

// Statistical features
export const STATISTICAL_FEATURES = [
  'mean',
  'std',
  'var',
  'rms',
  'p2p',
  'skew',
  'kurtosis',
] as const;

// Signal features
export const SIGNAL_FEATURES = ['zcr', 'trend', 'auc'] as const;

// All features
export const ALL_FEATURES = [...STATISTICAL_FEATURES, ...SIGNAL_FEATURES] as const;

// HTTP status codes we retry on
export const RETRYABLE_HTTP_CODES = [408, 429, 500, 502, 503, 504] as const;

// Default HTTP headers
export const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'mcp-influxdb/1.0.0',
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 1000;
export const MAX_PAGE_SIZE = 10000;

// Cache keys
export const CACHE_KEY_PREFIX = {
  METADATA: 'meta:',
  QUERY: 'query:',
  LAST: 'last:',
} as const;
