import { InvalidTimeRangeError } from './errors.js';

// Parse ISO 8601 or relative time strings to timestamp
export function parseTime(timeStr: string): Date {
  // Try ISO 8601 first
  const isoDate = new Date(timeStr);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Try relative time (e.g., "now() - 1h")
  const relativeMatch = timeStr.match(/^now\(\)\s*([+-])\s*(\d+)([smhd])$/i);
  if (relativeMatch) {
    const [, operator, amountStr, unit] = relativeMatch;
    const amount = parseInt(amountStr, 10);
    const now = new Date();

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    const multiplier = multipliers[unit.toLowerCase()];
    if (!multiplier) {
      throw new InvalidTimeRangeError(`Invalid time unit: ${unit}`);
    }

    const offset = amount * multiplier;
    return new Date(operator === '+' ? now.getTime() + offset : now.getTime() - offset);
  }

  throw new InvalidTimeRangeError(`Invalid time format: ${timeStr}`);
}

// Convert Date to ISO 8601 string for InfluxDB
export function toInfluxTime(date: Date, tz = 'UTC'): string {
  if (tz === 'UTC') {
    return date.toISOString();
  }

  // For other timezones, we rely on InfluxDB's tz() function
  return date.toISOString();
}

// Parse duration string (e.g., "1h", "5m", "30s") to milliseconds
export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/i);
  if (!match) {
    throw new InvalidTimeRangeError(`Invalid duration format: ${duration}`);
  }

  const [, amountStr, unit] = match;
  const amount = parseInt(amountStr, 10);

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  const multiplier = multipliers[unit.toLowerCase()];
  if (!multiplier) {
    throw new InvalidTimeRangeError(`Invalid duration unit: ${unit}`);
  }

  return amount * multiplier;
}

// Format duration from milliseconds to human-readable string
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// Validate time range
export function validateTimeRange(from: string, to: string, maxRangeDays: number): void {
  const fromDate = parseTime(from);
  const toDate = parseTime(to);

  if (fromDate >= toDate) {
    throw new InvalidTimeRangeError('Start time must be before end time', { from, to });
  }

  const rangeDays = (toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000);
  if (rangeDays > maxRangeDays) {
    throw new InvalidTimeRangeError(
      `Time range exceeds maximum of ${maxRangeDays} days (got ${rangeDays.toFixed(1)} days)`,
      { from, to, rangeDays, maxRangeDays }
    );
  }
}

// Calculate optimal window for downsampling
export function calculateOptimalWindow(
  fromMs: number,
  toMs: number,
  maxPoints: number
): string {
  const rangeMs = toMs - fromMs;
  const windowMs = Math.ceil(rangeMs / maxPoints);

  // Round to nice intervals
  if (windowMs < 1000) return '1s';
  if (windowMs < 60 * 1000) return `${Math.ceil(windowMs / 1000)}s`;
  if (windowMs < 60 * 60 * 1000) return `${Math.ceil(windowMs / (60 * 1000))}m`;
  if (windowMs < 24 * 60 * 60 * 1000) return `${Math.ceil(windowMs / (60 * 60 * 1000))}h`;
  return `${Math.ceil(windowMs / (24 * 60 * 60 * 1000))}d`;
}

// Estimate number of points for a time range and interval
export function estimatePoints(fromMs: number, toMs: number, intervalMs: number): number {
  return Math.ceil((toMs - fromMs) / intervalMs);
}
