import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { InfluxDBClient } from '../influx/client.js';
import { TTLCache } from '../cache/lru.js';
import { RateLimiter } from '../utils/rate-limiter.js';
import { MetadataTools } from '../tools/metadata.js';
import { TimeSeriesTools } from '../tools/timeseries.js';
import { FeatureTools } from '../tools/features.js';
import { HealthTools } from '../tools/health.js';
import { loadEnv } from '../config/env.js';
import { createLogger } from '../utils/logger.js';
import type { Env } from '../config/env.js';
import * as schemas from '../schemas/tools.js';

export class MCPServer {
  private server: Server;
  private client: InfluxDBClient;
  private cache: TTLCache<unknown>;
  private rateLimiter: RateLimiter;
  private metadata: MetadataTools;
  private timeseries: TimeSeriesTools;
  private features: FeatureTools;
  private health: HealthTools;
  private env: Env;

  constructor() {
    this.env = loadEnv();
    const logger = createLogger();

    logger.info({
      type: 'server_init',
      name: this.env.MCP_SERVER_NAME,
      version: this.env.MCP_SERVER_VERSION,
    });

    // Initialize InfluxDB client
    this.client = new InfluxDBClient({
      protocol: this.env.INFLUX_PROTOCOL,
      host: this.env.INFLUX_HOST,
      port: this.env.INFLUX_PORT,
      username: this.env.INFLUX_USERNAME,
      password: this.env.INFLUX_PASSWORD,
      timeout: this.env.INFLUX_TIMEOUT_MS,
      maxConnections: this.env.INFLUX_MAX_CONNS,
      retryMax: this.env.INFLUX_RETRY_MAX,
      retryDelay: this.env.INFLUX_RETRY_DELAY_MS,
    });

    // Initialize cache
    this.cache = new TTLCache(this.env.CACHE_MAX_SIZE, this.env.CACHE_TTL_S);

    // Initialize rate limiter
    this.rateLimiter = new RateLimiter(this.env.RATE_LIMIT_QPS, this.env.RATE_LIMIT_CONCURRENT);

    // Initialize tools
    this.metadata = new MetadataTools(this.client, this.cache);
    this.timeseries = new TimeSeriesTools(this.client, this.cache);
    this.features = new FeatureTools();
    this.health = new HealthTools(this.client);

    // Initialize MCP server
    this.server = new Server(
      {
        name: this.env.MCP_SERVER_NAME,
        version: this.env.MCP_SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Metadata tools
          {
            name: 'meta.list_databases',
            description: 'List all available InfluxDB databases',
            inputSchema: { type: 'object', properties: {}, additionalProperties: false },
          },
          {
            name: 'meta.list_measurements',
            description: 'List measurements in a database',
            inputSchema: schemas.ListMeasurementsSchema,
          },
          {
            name: 'meta.list_fields',
            description: 'List fields in a measurement',
            inputSchema: schemas.ListFieldsSchema,
          },
          {
            name: 'meta.list_tags',
            description: 'List tags in a measurement',
            inputSchema: schemas.ListTagsSchema,
          },
          {
            name: 'meta.retention_policies',
            description: 'List retention policies for a database',
            inputSchema: schemas.RetentionPoliciesSchema,
          },
          // Timeseries tools
          {
            name: 'timeseries.query',
            description: 'Query time series data with flexible options',
            inputSchema: schemas.TimeSeriesQuerySchema,
          },
          {
            name: 'timeseries.last',
            description: 'Get last value(s) efficiently',
            inputSchema: schemas.LastValueSchema,
          },
          {
            name: 'timeseries.window_agg',
            description: 'Window aggregation shortcut',
            inputSchema: schemas.WindowAggSchema,
          },
          // Features tool
          {
            name: 'features.extract',
            description: 'Extract statistical features from time series',
            inputSchema: schemas.FeatureExtractionSchema,
          },
          // Health tool
          {
            name: 'health.ping',
            description: 'Check InfluxDB connectivity',
            inputSchema: { type: 'object', properties: {}, additionalProperties: false },
          },
        ],
      };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        return await this.rateLimiter.execute(async () => {
          return await this.handleToolCall(name, args || {});
        });
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async handleToolCall(name: string, args: any): Promise<any> {
    switch (name) {
      // Metadata tools
      case 'meta.list_databases':
        return { content: [{ type: 'text', text: JSON.stringify(await this.metadata.listDatabases(), null, 2) }] };

      case 'meta.list_measurements':
        return { content: [{ type: 'text', text: JSON.stringify(await this.metadata.listMeasurements(args.db, args.match), null, 2) }] };

      case 'meta.list_fields':
        return { content: [{ type: 'text', text: JSON.stringify(await this.metadata.listFields(args.db, args.measurement), null, 2) }] };

      case 'meta.list_tags':
        return { content: [{ type: 'text', text: JSON.stringify(await this.metadata.listTags(args.db, args.measurement), null, 2) }] };

      case 'meta.retention_policies':
        return { content: [{ type: 'text', text: JSON.stringify(await this.metadata.retentionPolicies(args.db), null, 2) }] };

      // Timeseries tools
      case 'timeseries.query':
        return { content: [{ type: 'text', text: JSON.stringify(await this.timeseries.query(args, args.page_size, args.cursor, args.no_cache), null, 2) }] };

      case 'timeseries.last':
        return { content: [{ type: 'text', text: JSON.stringify(await this.timeseries.last(args.db, args.measurement, args.field, args.where?.tags, args.group_by_tags), null, 2) }] };

      case 'timeseries.window_agg':
        return { content: [{ type: 'text', text: JSON.stringify(await this.timeseries.windowAgg(args.db, args.measurement, args.field, args.from, args.to, args.window, args.aggs, args.percentile, args.group_by_tags, args.fill, args.tz), null, 2) }] };

      // Features tool
      case 'features.extract':
        return { content: [{ type: 'text', text: JSON.stringify(await this.features.extract(args.series || [], args.features, args.rolling), null, 2) }] };

      // Health tool
      case 'health.ping':
        return { content: [{ type: 'text', text: JSON.stringify(await this.health.ping(), null, 2) }] };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    const logger = createLogger();
    logger.info({
      type: 'server_started',
      transport: 'stdio',
    });
  }

  async close(): Promise<void> {
    await this.client.close();
    await this.server.close();
  }
}
