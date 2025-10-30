import { z } from 'zod';

// Common schemas
const DatabaseSchema = z.string().min(1);
const MeasurementSchema = z.string().min(1);
const FieldSchema = z.string().min(1);

// Metadata tool schemas
export const ListDatabasesSchema = z.object({});

export const ListMeasurementsSchema = z.object({
  db: DatabaseSchema,
  match: z.string().optional(),
});

export const ListFieldsSchema = z.object({
  db: DatabaseSchema,
  measurement: MeasurementSchema,
});

export const ListTagsSchema = z.object({
  db: DatabaseSchema,
  measurement: MeasurementSchema,
});

export const RetentionPoliciesSchema = z.object({
  db: DatabaseSchema,
});

// Timeseries tool schemas
export const TimeSeriesQuerySchema = z.object({
  db: DatabaseSchema,
  measurement: MeasurementSchema,
  fields: z.union([z.array(z.string()), z.literal('*')]),
  where: z
    .object({
      time: z
        .object({
          from: z.string(),
          to: z.string(),
        })
        .optional(),
      tags: z.record(z.union([z.string(), z.object({ op: z.enum(['=', '!=', '=~', '!~']), value: z.string() })])).optional(),
    })
    .optional(),
  agg: z.enum(['mean', 'median', 'min', 'max', 'sum', 'count', 'spread', 'stddev', 'percentile']).optional(),
  percentile: z.number().min(0).max(100).optional(),
  group_by_time: z.string().optional(),
  group_by_tags: z.array(z.string()).optional(),
  fill: z.union([z.enum(['none', 'null', 'previous', 'linear']), z.number()]).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().positive().optional(),
  chunk_size: z.number().int().positive().optional(),
  tz: z.string().optional(),
  page_size: z.number().int().positive().optional(),
  cursor: z.string().optional(),
  no_cache: z.boolean().optional(),
});

export const LastValueSchema = z.object({
  db: DatabaseSchema,
  measurement: MeasurementSchema,
  field: FieldSchema,
  where: z
    .object({
      tags: z.record(z.string()).optional(),
    })
    .optional(),
  group_by_tags: z.array(z.string()).optional(),
});

export const WindowAggSchema = z.object({
  db: DatabaseSchema,
  measurement: MeasurementSchema,
  field: FieldSchema,
  from: z.string(),
  to: z.string(),
  window: z.string(),
  aggs: z.array(z.enum(['mean', 'min', 'max', 'sum', 'count', 'stddev', 'spread', 'percentile'])),
  percentile: z.number().min(0).max(100).optional(),
  group_by_tags: z.array(z.string()).optional(),
  fill: z.union([z.enum(['none', 'previous']), z.number()]).optional(),
  tz: z.string().optional(),
});

// Feature extraction schema
export const FeatureExtractionSchema = z.object({
  series: z
    .array(
      z.object({
        t: z.string(),
        v: z.number(),
      })
    )
    .optional(),
  features: z.array(
    z.enum(['mean', 'std', 'var', 'rms', 'p2p', 'skew', 'kurtosis', 'zcr', 'trend', 'auc'])
  ),
  rolling: z
    .object({
      window: z.string(),
      step: z.string().optional(),
    })
    .optional(),
  sampling_hz: z.number().positive().optional(),
});

// Health schema
export const HealthPingSchema = z.object({});
