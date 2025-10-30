// Rolling window analysis

import type { TimeSeriesPoint } from '@/influx/types';
import { parseDuration } from '@/utils/time';

export interface RollingWindowResult {
  window_start: string;
  window_end: string;
  values: Record<string, number>;
}

export function applyRollingWindow(
  series: TimeSeriesPoint[],
  windowMs: number,
  stepMs: number,
  calculateFeatures: (values: number[]) => Record<string, number>
): RollingWindowResult[] {
  const results: RollingWindowResult[] = [];

  if (series.length === 0) return results;

  const startTime = new Date(series[0].t).getTime();
  const endTime = new Date(series[series.length - 1].t).getTime();

  let windowStart = startTime;

  while (windowStart + windowMs <= endTime) {
    const windowEnd = windowStart + windowMs;

    // Filter points in this window
    const windowPoints = series.filter((point) => {
      const pointTime = new Date(point.t).getTime();
      return pointTime >= windowStart && pointTime < windowEnd;
    });

    if (windowPoints.length > 0) {
      const values = windowPoints.map((p) => p.v);
      const features = calculateFeatures(values);

      results.push({
        window_start: new Date(windowStart).toISOString(),
        window_end: new Date(windowEnd).toISOString(),
        values: features,
      });
    }

    windowStart += stepMs;
  }

  return results;
}

export function parseRollingConfig(
  windowStr: string,
  stepStr?: string
): { windowMs: number; stepMs: number } {
  const windowMs = parseDuration(windowStr);
  const stepMs = stepStr ? parseDuration(stepStr) : windowMs;

  return { windowMs, stepMs };
}
