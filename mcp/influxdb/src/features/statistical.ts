// Statistical features calculation

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function std(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
}

export function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  return values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
}

export function rms(values: number[]): number {
  if (values.length === 0) return 0;
  const sumSquares = values.reduce((sum, v) => sum + v * v, 0);
  return Math.sqrt(sumSquares / values.length);
}

export function peakToPeak(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values) - Math.min(...values);
}

export function skewness(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const stdDev = std(values);
  if (stdDev === 0) return 0;

  const n = values.length;
  const m3 = values.reduce((sum, v) => sum + Math.pow(v - avg, 3), 0) / n;

  return m3 / Math.pow(stdDev, 3);
}

export function kurtosis(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const stdDev = std(values);
  if (stdDev === 0) return 0;

  const n = values.length;
  const m4 = values.reduce((sum, v) => sum + Math.pow(v - avg, 4), 0) / n;

  return m4 / Math.pow(stdDev, 4);
}
