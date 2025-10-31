import type { QueryOptions, QueryPlan } from './types.js';
import { buildQueryFromOptions, buildLastQuery } from './query-builder.js';
import { parseTime, calculateOptimalWindow, estimatePoints } from '../utils/time.js';
import { MaxPointsExceededError } from '../utils/errors.js';
import { getLogger } from '../utils/logger.js';

export class QueryPlanner {
  constructor(
    private readonly maxPoints: number,
    private readonly maxLimit: number
  ) {}

  // Plan query execution strategy
  plan(options: QueryOptions, isLastValue = false): QueryPlan {
    const logger = getLogger();

    // Strategy 1: LAST value query
    if (isLastValue) {
      const query = buildLastQuery(
        options.measurement,
        Array.isArray(options.fields) ? options.fields[0] : '*',
        options.where?.tags as any,
        options.group_by_tags
      );

      return {
        strategy: 'LAST',
        estimatedPoints: 1,
        needsDownsampling: false,
        query,
      };
    }

    // Strategy 2: Already aggregated
    if (options.agg && options.group_by_time) {
      const estimated = this.estimateAggregatedPoints(options);

      if (estimated > this.maxPoints) {
        // Need larger window
        const optimalWindow = this.calculateLargerWindow(options);
        const updatedOptions = { ...options, group_by_time: optimalWindow };
        const query = buildQueryFromOptions(updatedOptions, this.maxLimit);

        logger.warn({
          type: 'query_plan_adjustment',
          reason: 'aggregated_exceeds_max',
          original_window: options.group_by_time,
          optimal_window: optimalWindow,
          estimated_points: estimated,
        });

        return {
          strategy: 'AGGREGATED',
          estimatedPoints: this.estimateAggregatedPoints(updatedOptions),
          needsDownsampling: true,
          window: optimalWindow,
          query,
        };
      }

      const query = buildQueryFromOptions(options, this.maxLimit);

      return {
        strategy: 'AGGREGATED',
        estimatedPoints: estimated,
        needsDownsampling: false,
        window: options.group_by_time,
        query,
      };
    }

    // Strategy 3: Raw data query
    const estimated = this.estimateRawPoints(options);

    // Check if raw query is feasible
    if (estimated <= this.maxPoints) {
      const query = buildQueryFromOptions(options, this.maxLimit);

      return {
        strategy: 'RAW',
        estimatedPoints: estimated,
        needsDownsampling: false,
        query,
      };
    }

    // Strategy 4: Must downsample
    const window = this.calculateDownsamplingWindow(options);

    // If no aggregation was specified, default to MEAN
    const agg = options.agg || 'mean';

    const downsampledOptions: QueryOptions = {
      ...options,
      agg,
      group_by_time: window,
    };

    const query = buildQueryFromOptions(downsampledOptions, this.maxLimit);
    const downsampledEstimate = this.estimateAggregatedPoints(downsampledOptions);

    logger.warn({
      type: 'query_plan_downsampling',
      estimated_raw_points: estimated,
      max_points: this.maxPoints,
      downsampling_window: window,
      estimated_downsampled: downsampledEstimate,
    });

    return {
      strategy: 'DOWNSAMPLED',
      estimatedPoints: downsampledEstimate,
      needsDownsampling: true,
      window,
      query,
    };
  }

  // Estimate points for raw data query
  private estimateRawPoints(options: QueryOptions): number {
    if (!options.where?.time) {
      // No time range specified - assume last 1 hour
      return 3600; // 1 point per second for 1 hour
    }

    const fromDate = parseTime(options.where.time.from);
    const toDate = parseTime(options.where.time.to);

    const rangeMs = toDate.getTime() - fromDate.getTime();

    // Assume 1 point per second as baseline
    // This is conservative; real data might have different frequency
    const estimated = Math.floor(rangeMs / 1000);

    // Multiply by number of fields if multiple fields
    const fieldCount = options.fields === '*' ? 5 : options.fields.length;

    return estimated * fieldCount;
  }

  // Estimate points for aggregated query
  private estimateAggregatedPoints(options: QueryOptions): number {
    if (!options.where?.time || !options.group_by_time) {
      return 1000; // Default estimate
    }

    const fromDate = parseTime(options.where.time.from);
    const toDate = parseTime(options.where.time.to);

    const rangeMs = toDate.getTime() - fromDate.getTime();

    // Parse window interval
    const windowMatch = options.group_by_time.match(/^(\d+)([smhd])$/);
    if (!windowMatch) {
      return 1000;
    }

    const [, amountStr, unit] = windowMatch;
    const amount = parseInt(amountStr, 10);

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    const windowMs = amount * multipliers[unit];
    const estimated = estimatePoints(fromDate.getTime(), toDate.getTime(), windowMs);

    // Multiply by number of fields
    const fieldCount = options.fields === '*' ? 5 : options.fields.length;

    // Multiply by number of tag groups if grouping by tags
    const groupMultiplier = options.group_by_tags ? Math.pow(10, options.group_by_tags.length) : 1;

    return estimated * fieldCount * groupMultiplier;
  }

  // Calculate optimal downsampling window
  private calculateDownsamplingWindow(options: QueryOptions): string {
    if (!options.where?.time) {
      return '1m'; // Default
    }

    const fromDate = parseTime(options.where.time.from);
    const toDate = parseTime(options.where.time.to);

    return calculateOptimalWindow(fromDate.getTime(), toDate.getTime(), this.maxPoints);
  }

  // Calculate larger window when aggregated query exceeds max points
  private calculateLargerWindow(options: QueryOptions): string {
    if (!options.where?.time || !options.group_by_time) {
      return '5m';
    }

    // Parse current window
    const windowMatch = options.group_by_time.match(/^(\d+)([smhd])$/);
    if (!windowMatch) {
      return '5m';
    }

    const [, amountStr, unit] = windowMatch;
    const amount = parseInt(amountStr, 10);

    // Double the window size
    const newAmount = amount * 2;

    return `${newAmount}${unit}`;
  }

  // Validate plan before execution
  validatePlan(plan: QueryPlan): void {
    if (plan.estimatedPoints > this.maxPoints * 1.5) {
      throw new MaxPointsExceededError(plan.estimatedPoints, this.maxPoints);
    }
  }
}
