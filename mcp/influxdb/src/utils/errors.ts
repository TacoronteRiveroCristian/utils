export class InfluxDBError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'InfluxDBError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class QueryValidationError extends InfluxDBError {
  constructor(message: string, details?: unknown) {
    super(message, 'QUERY_VALIDATION_ERROR', details);
    this.name = 'QueryValidationError';
  }
}

export class DatabaseNotAllowedError extends InfluxDBError {
  constructor(database: string) {
    super(`Database '${database}' is not in the allowed list`, 'DATABASE_NOT_ALLOWED', {
      database,
    });
    this.name = 'DatabaseNotAllowedError';
  }
}

export class RateLimitError extends InfluxDBError {
  constructor(message: string, public readonly retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR', { retryAfter });
    this.name = 'RateLimitError';
  }
}

export class TimeoutError extends InfluxDBError {
  constructor(message: string, public readonly timeoutMs: number) {
    super(message, 'TIMEOUT_ERROR', { timeoutMs });
    this.name = 'TimeoutError';
  }
}

export class MaxPointsExceededError extends InfluxDBError {
  constructor(
    public readonly estimated: number,
    public readonly maxAllowed: number
  ) {
    super(
      `Query would return ~${estimated} points, exceeding limit of ${maxAllowed}`,
      'MAX_POINTS_EXCEEDED',
      { estimated, maxAllowed }
    );
    this.name = 'MaxPointsExceededError';
  }
}

export class InvalidTimeRangeError extends InfluxDBError {
  constructor(message: string, details?: unknown) {
    super(message, 'INVALID_TIME_RANGE', details);
    this.name = 'InvalidTimeRangeError';
  }
}

export class ConnectionError extends InfluxDBError {
  constructor(message: string, public readonly host: string, public readonly port: number) {
    super(message, 'CONNECTION_ERROR', { host, port });
    this.name = 'ConnectionError';
  }
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof TimeoutError) {
    return true;
  }

  if (error instanceof InfluxDBError && error.code === 'CONNECTION_ERROR') {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('econnreset') ||
      message.includes('etimedout')
    );
  }

  return false;
}
