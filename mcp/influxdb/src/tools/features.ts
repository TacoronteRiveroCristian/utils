import type { TimeSeriesPoint, FeatureResult } from '@/influx/types';
import * as stat from '@/features/statistical';
import * as signal from '@/features/signal';
import { applyRollingWindow, parseRollingConfig } from '@/features/rolling';

export class FeatureTools {
  // Extract features from time series
  async extract(
    series: TimeSeriesPoint[],
    features: string[],
    rolling?: { window: string; step?: string }
  ): Promise<FeatureResult> {
    const result: FeatureResult = {};

    // Calculate global features
    if (!rolling) {
      result.global = this.calculateFeatures(series, features);
    }

    // Calculate rolling window features
    if (rolling) {
      const { windowMs, stepMs } = parseRollingConfig(rolling.window, rolling.step);

      result.rolling = applyRollingWindow(series, windowMs, stepMs, (values) => {
        const tempSeries = values.map((v, i) => ({
          t: new Date(Date.now() + i * 1000).toISOString(),
          v,
        }));
        return this.calculateFeatures(tempSeries, features);
      });
    }

    return result;
  }

  private calculateFeatures(series: TimeSeriesPoint[], features: string[]): Record<string, number> {
    const values = series.map((p) => p.v);
    const result: Record<string, number> = {};

    for (const feature of features) {
      switch (feature) {
        case 'mean':
          result.mean = stat.mean(values);
          break;
        case 'std':
          result.std = stat.std(values);
          break;
        case 'var':
          result.var = stat.variance(values);
          break;
        case 'rms':
          result.rms = stat.rms(values);
          break;
        case 'p2p':
          result.p2p = stat.peakToPeak(values);
          break;
        case 'skew':
          result.skew = stat.skewness(values);
          break;
        case 'kurtosis':
          result.kurtosis = stat.kurtosis(values);
          break;
        case 'zcr':
          result.zcr = signal.zeroCrossingRate(values);
          break;
        case 'trend':
          result.trend = signal.trend(series);
          break;
        case 'auc':
          result.auc = signal.areaUnderCurve(series);
          break;
      }
    }

    return result;
  }
}
