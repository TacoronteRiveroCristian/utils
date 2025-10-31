import pino from 'pino';
import { loadEnv } from '../config/env.js';

let logger: pino.Logger | null = null;

export function createLogger(): pino.Logger {
  if (logger) {
    return logger;
  }

  const env = loadEnv();

  const options: pino.LoggerOptions = {
    level: env.LOG_LEVEL,
    ...(env.LOG_FORMAT === 'pretty' && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    }),
  };

  logger = pino(options);
  return logger;
}

export function getLogger(): pino.Logger {
  if (!logger) {
    return createLogger();
  }
  return logger;
}

// Helper to log query execution
export function logQuery(
  query: string,
  db: string,
  durationMs: number,
  pointsScanned?: number
): void {
  const logger = getLogger();
  logger.info({
    type: 'query_execution',
    db,
    query: query.substring(0, 200), // truncate long queries
    duration_ms: durationMs,
    points_scanned: pointsScanned,
  });
}

// Helper to log errors
export function logError(error: unknown, context?: Record<string, unknown>): void {
  const logger = getLogger();
  const errorObj = error instanceof Error ? error : new Error(String(error));

  logger.error({
    type: 'error',
    error: {
      name: errorObj.name,
      message: errorObj.message,
      stack: errorObj.stack,
    },
    ...context,
  });
}

// Helper to log performance metrics
export function logMetrics(metrics: Record<string, number>): void {
  const logger = getLogger();
  logger.debug({
    type: 'metrics',
    ...metrics,
  });
}
