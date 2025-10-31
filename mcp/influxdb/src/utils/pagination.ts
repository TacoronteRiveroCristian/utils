import { createHash } from 'crypto';
import type { PaginationCursor } from '../influx/types.js';

// Encode pagination cursor to base64
export function encodeCursor(cursor: PaginationCursor): string {
  const json = JSON.stringify(cursor);
  return Buffer.from(json).toString('base64');
}

// Decode pagination cursor from base64
export function decodeCursor(cursorStr: string): PaginationCursor {
  try {
    const json = Buffer.from(cursorStr, 'base64').toString('utf-8');
    return JSON.parse(json) as PaginationCursor;
  } catch (error) {
    throw new Error(`Invalid pagination cursor: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Create hash of query parameters for cursor validation
export function hashQueryParams(params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = params[key];
        return acc;
      },
      {} as Record<string, unknown>
    );

  const json = JSON.stringify(sorted);
  return createHash('sha256').update(json).digest('hex').substring(0, 16);
}

// Validate cursor against current query params
export function validateCursor(cursor: PaginationCursor, currentParams: Record<string, unknown>): boolean {
  const currentHash = hashQueryParams(currentParams);
  return cursor.hash === currentHash;
}

// Create a new cursor
export function createCursor(
  db: string,
  measurement: string,
  offset: number,
  queryParams: Record<string, unknown>,
  timeAnchor?: string
): string {
  const cursor: PaginationCursor = {
    db,
    measurement,
    offset,
    hash: hashQueryParams(queryParams),
    ...(timeAnchor && { timeAnchor }),
  };

  return encodeCursor(cursor);
}
