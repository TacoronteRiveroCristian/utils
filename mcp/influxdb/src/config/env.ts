import { z } from 'zod';

const envSchema = z.object({
  // InfluxDB Connection
  INFLUX_PROTOCOL: z.enum(['http', 'https']).default('http'),
  INFLUX_HOST: z.string().default('localhost'),
  INFLUX_PORT: z.coerce.number().int().positive().default(8086),
  INFLUX_USERNAME: z.string().min(1),
  INFLUX_PASSWORD: z.string().min(1),
  INFLUX_DATABASE: z.string().optional(),

  // Timeouts and Connections
  INFLUX_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  INFLUX_MAX_CONNS: z.coerce.number().int().positive().default(10),
  INFLUX_RETRY_MAX: z.coerce.number().int().min(0).default(3),
  INFLUX_RETRY_DELAY_MS: z.coerce.number().int().positive().default(500),

  // Security and Limits
  ALLOWED_DATABASES: z.string().default('*'),
  MAX_POINTS: z.coerce.number().int().positive().default(1000000),
  MAX_RANGE_DAYS: z.coerce.number().int().positive().default(365),
  MAX_LIMIT: z.coerce.number().int().positive().default(10000),
  MAX_CHUNK_SIZE: z.coerce.number().int().positive().default(10000),

  // Cache and Performance
  CACHE_TTL_S: z.coerce.number().int().positive().default(30),
  CACHE_MAX_SIZE: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_QPS: z.coerce.number().int().positive().default(20),
  RATE_LIMIT_CONCURRENT: z.coerce.number().int().positive().default(5),

  // General Configuration
  DEFAULT_TZ: z.string().default('UTC'),
  DEFAULT_PAGE_SIZE: z.coerce.number().int().positive().default(1000),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),

  // MCP Server
  MCP_SERVER_NAME: z.string().default('influxdb-mcp'),
  MCP_SERVER_VERSION: z.string().default('1.0.0'),
  MCP_TRANSPORT: z.enum(['stdio', 'http']).default('stdio'),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function loadEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Environment validation failed:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    throw new Error('Invalid environment configuration');
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function getAllowedDatabases(): string[] | '*' {
  const env = loadEnv();
  if (env.ALLOWED_DATABASES === '*') {
    return '*';
  }
  return env.ALLOWED_DATABASES.split(',')
    .map((db) => db.trim())
    .filter(Boolean);
}

export function isDatabaseAllowed(database: string): boolean {
  const allowed = getAllowedDatabases();
  if (allowed === '*') {
    return true;
  }
  return allowed.includes(database);
}
