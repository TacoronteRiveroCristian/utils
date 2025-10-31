import type { InfluxDBClient } from '../influx/client.js';

export class HealthTools {
  constructor(private readonly client: InfluxDBClient) {}

  // Ping InfluxDB to check connectivity
  async ping(): Promise<{
    ok: boolean;
    influx: string;
    server_time: string;
    version?: string;
  }> {
    const result = await this.client.ping();

    return {
      ok: result.ok,
      influx: result.ok ? 'pong' : 'no response',
      server_time: new Date().toISOString(),
      version: result.version,
    };
  }
}
