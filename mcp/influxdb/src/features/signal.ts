// Signal processing features

import type { TimeSeriesPoint } from '../influx/types.js';

export function zeroCrossingRate(values: number[]): number {
  if (values.length < 2) return 0;

  let crossings = 0;
  for (let i = 1; i < values.length; i++) {
    if ((values[i] >= 0 && values[i - 1] < 0) || (values[i] < 0 && values[i - 1] >= 0)) {
      crossings++;
    }
  }

  return crossings;
}

export function trend(series: TimeSeriesPoint[]): number {
  if (series.length < 2) return 0;

  // Simple linear regression: y = a + bx
  // We want the slope (b)
  const n = series.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    const x = i; // Time index
    const y = series[i].v;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  return slope;
}

export function areaUnderCurve(series: TimeSeriesPoint[]): number {
  if (series.length < 2) return 0;

  // Trapezoidal integration
  let area = 0;

  for (let i = 1; i < series.length; i++) {
    const t1 = new Date(series[i - 1].t).getTime();
    const t2 = new Date(series[i].t).getTime();
    const dt = (t2 - t1) / 1000; // seconds

    const v1 = series[i - 1].v;
    const v2 = series[i].v;

    area += (v1 + v2) * dt / 2;
  }

  return area;
}
