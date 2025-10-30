import type { InfluxDBResponse, InfluxDBSeries } from './types';

// Process chunked streaming responses
export async function* processChunkedResponse(
  streamIterator: AsyncGenerator<InfluxDBResponse, void, unknown>
): AsyncGenerator<InfluxDBSeries[], void, unknown> {
  for await (const chunk of streamIterator) {
    if (chunk.results && chunk.results.length > 0) {
      const result = chunk.results[0];

      if (result.error) {
        throw new Error(`InfluxDB error: ${result.error}`);
      }

      if (result.series && result.series.length > 0) {
        yield result.series;
      }
    }
  }
}

// Merge multiple series into single result
export function mergeSeries(seriesArray: InfluxDBSeries[][]): InfluxDBSeries[] {
  const merged: InfluxDBSeries[] = [];

  for (const seriesChunk of seriesArray) {
    for (const series of seriesChunk) {
      // Find existing series with same name and tags
      const existing = merged.find((s) => {
        return (
          s.name === series.name &&
          JSON.stringify(s.tags || {}) === JSON.stringify(series.tags || {})
        );
      });

      if (existing) {
        // Append values to existing series
        existing.values.push(...series.values);
      } else {
        // Add as new series
        merged.push({
          name: series.name,
          tags: series.tags,
          columns: series.columns,
          values: [...series.values],
        });
      }
    }
  }

  return merged;
}

// Convert series to row format
export function seriesToRows(
  series: InfluxDBSeries[]
): { columns: string[]; rows: unknown[][] } {
  if (series.length === 0) {
    return { columns: [], rows: [] };
  }

  // If single series without tags, return as-is
  if (series.length === 1 && !series[0].tags) {
    return {
      columns: series[0].columns,
      rows: series[0].values,
    };
  }

  // Multiple series or series with tags - need to merge with tag columns
  const firstSeries = series[0];
  const tagKeys = firstSeries.tags ? Object.keys(firstSeries.tags) : [];

  // Build column list: time, ...tags, ...fields
  const columns = [...tagKeys, ...firstSeries.columns];

  const rows: unknown[][] = [];

  for (const s of series) {
    const tagValues = tagKeys.map((key) => (s.tags ? s.tags[key] : null));

    for (const row of s.values) {
      rows.push([...tagValues, ...row]);
    }
  }

  return { columns, rows };
}

// Paginate rows
export function paginateRows(
  rows: unknown[][],
  pageSize: number,
  offset = 0
): { rows: unknown[][]; hasMore: boolean; nextOffset: number } {
  const start = offset;
  const end = offset + pageSize;

  const pageRows = rows.slice(start, end);
  const hasMore = end < rows.length;
  const nextOffset = hasMore ? end : -1;

  return {
    rows: pageRows,
    hasMore,
    nextOffset,
  };
}

// Count total points in series
export function countPoints(series: InfluxDBSeries[]): number {
  return series.reduce((total, s) => total + s.values.length, 0);
}

// Extract time column index
export function getTimeColumnIndex(columns: string[]): number {
  return columns.findIndex((col) => col.toLowerCase() === 'time');
}

// Sort rows by time
export function sortRowsByTime(
  rows: unknown[][],
  timeIndex: number,
  direction: 'asc' | 'desc' = 'asc'
): unknown[][] {
  return rows.sort((a, b) => {
    const timeA = a[timeIndex] as string | number;
    const timeB = b[timeIndex] as string | number;

    const comparison = timeA < timeB ? -1 : timeA > timeB ? 1 : 0;

    return direction === 'asc' ? comparison : -comparison;
  });
}

// Limit rows
export function limitRows(rows: unknown[][], limit: number): unknown[][] {
  return rows.slice(0, limit);
}
