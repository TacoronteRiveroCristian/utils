#!/usr/bin/env node

import { MCPServer } from './server.js';
import { getLogger } from '../utils/logger.js';

async function main(): Promise<void> {
  const logger = getLogger();

  try {
    const server = new MCPServer();

    // Handle shutdown gracefully
    process.on('SIGINT', async () => {
      logger.info({ type: 'shutdown', signal: 'SIGINT' });
      await server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info({ type: 'shutdown', signal: 'SIGTERM' });
      await server.close();
      process.exit(0);
    });

    // Start server
    await server.start();
  } catch (error) {
    logger.error({
      type: 'startup_error',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
