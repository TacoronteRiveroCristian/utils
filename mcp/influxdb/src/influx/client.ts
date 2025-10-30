import { request, Agent } from 'undici';
import type { InfluxDBClientConfig, InfluxDBResponse } from './types';
import { ConnectionError, TimeoutError, InfluxDBError } from '@/utils/errors';
import { withRetry } from '@/utils/retry';
import { getLogger, logQuery } from '@/utils/logger';
import { DEFAULT_HEADERS } from '@/config/constants';

export class InfluxDBClient {
  private readonly baseUrl: string;
  private readonly auth: string;
  private readonly agent: Agent;
  private readonly config: InfluxDBClientConfig;

  constructor(config: InfluxDBClientConfig) {
    this.config = config;
    this.baseUrl = `${config.protocol}://${config.host}:${config.port}`;
    this.auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');

    // Create agent with keep-alive pool
    this.agent = new Agent({
      connections: config.maxConnections,
      keepAliveTimeout: 30000,
      keepAliveMaxTimeout: 600000,
    });
  }

  // Execute query with retry and timeout
  async query(
    query: string,
    database: string,
    options: {
      chunked?: boolean;
      chunkSize?: number;
      epoch?: 'ns' | 'u' | 'ms' | 's' | 'm' | 'h';
    } = {}
  ): Promise<InfluxDBResponse> {
    const logger = getLogger();
    const startTime = Date.now();

    try {
      const result = await withRetry(
        async () => {
          return await this.executeQuery(query, database, options);
        },
        {
          maxRetries: this.config.retryMax,
          initialDelayMs: this.config.retryDelay,
        }
      );

      const durationMs = Date.now() - startTime;
      logQuery(query, database, durationMs, this.countPoints(result));

      return result;
    } catch (error) {
      logger.error({
        type: 'query_error',
        query,
        database,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Execute single query
  private async executeQuery(
    query: string,
    database: string,
    options: {
      chunked?: boolean;
      chunkSize?: number;
      epoch?: 'ns' | 'u' | 'ms' | 's' | 'm' | 'h';
    }
  ): Promise<InfluxDBResponse> {
    const url = new URL('/query', this.baseUrl);
    url.searchParams.set('db', database);
    url.searchParams.set('q', query);

    if (options.chunked) {
      url.searchParams.set('chunked', 'true');
      url.searchParams.set('chunk_size', String(options.chunkSize || 10000));
    }

    if (options.epoch) {
      url.searchParams.set('epoch', options.epoch);
    }

    try {
      const response = await request(url.toString(), {
        method: 'GET',
        headers: {
          ...DEFAULT_HEADERS,
          Authorization: `Basic ${this.auth}`,
        },
        dispatcher: this.agent,
        bodyTimeout: this.config.timeout,
        headersTimeout: this.config.timeout,
      });

      if (response.statusCode === 200) {
        const body = await response.body.json();
        return body as InfluxDBResponse;
      }

      if (response.statusCode === 401) {
        throw new ConnectionError(
          'Authentication failed',
          this.config.host,
          this.config.port
        );
      }

      if (response.statusCode === 404) {
        throw new InfluxDBError(`Database '${database}' not found`, 'DATABASE_NOT_FOUND');
      }

      const errorBody = await response.body.text();
      throw new InfluxDBError(
        `HTTP ${response.statusCode}: ${errorBody}`,
        'HTTP_ERROR',
        { statusCode: response.statusCode }
      );
    } catch (error) {
      if (error instanceof InfluxDBError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'UndiciError' && error.message.includes('timeout')) {
          throw new TimeoutError(
            `Query timeout after ${this.config.timeout}ms`,
            this.config.timeout
          );
        }

        if (error.message.includes('ECONNREFUSED')) {
          throw new ConnectionError(
            'Connection refused',
            this.config.host,
            this.config.port
          );
        }
      }

      throw new InfluxDBError(
        `Query execution failed: ${error instanceof Error ? error.message : String(error)}`,
        'QUERY_EXECUTION_ERROR'
      );
    }
  }

  // Ping InfluxDB server
  async ping(): Promise<{ ok: boolean; version?: string }> {
    const url = new URL('/ping', this.baseUrl);

    try {
      const response = await request(url.toString(), {
        method: 'GET',
        headers: {
          ...DEFAULT_HEADERS,
        },
        dispatcher: this.agent,
        headersTimeout: 5000,
      });

      const version = response.headers['x-influxdb-version'];

      return {
        ok: response.statusCode === 204,
        version: version ? String(version) : undefined,
      };
    } catch (error) {
      return { ok: false };
    }
  }

  // Count total points in response
  private countPoints(response: InfluxDBResponse): number {
    let total = 0;

    for (const result of response.results) {
      if (result.series) {
        for (const series of result.series) {
          total += series.values.length;
        }
      }
    }

    return total;
  }

  // Stream chunked response
  async *streamQuery(
    query: string,
    database: string,
    chunkSize = 10000
  ): AsyncGenerator<InfluxDBResponse, void, unknown> {
    const url = new URL('/query', this.baseUrl);
    url.searchParams.set('db', database);
    url.searchParams.set('q', query);
    url.searchParams.set('chunked', 'true');
    url.searchParams.set('chunk_size', String(chunkSize));

    const response = await request(url.toString(), {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        Authorization: `Basic ${this.auth}`,
      },
      dispatcher: this.agent,
      bodyTimeout: this.config.timeout,
    });

    if (response.statusCode !== 200) {
      const errorBody = await response.body.text();
      throw new InfluxDBError(
        `HTTP ${response.statusCode}: ${errorBody}`,
        'HTTP_ERROR'
      );
    }

    const decoder = new TextDecoder();
    let buffer = '';

    for await (const chunk of response.body) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          yield JSON.parse(line) as InfluxDBResponse;
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      yield JSON.parse(buffer) as InfluxDBResponse;
    }
  }

  // Close client and cleanup
  async close(): Promise<void> {
    await this.agent.close();
  }
}
