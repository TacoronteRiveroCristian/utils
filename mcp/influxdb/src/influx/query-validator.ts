import { QueryValidationError } from '@/utils/errors';
import { FORBIDDEN_KEYWORDS, ALLOWED_FUNCTIONS } from '@/config/constants';

// Validate that query is read-only (SELECT or SHOW only)
export function validateReadOnly(query: string): void {
  const upperQuery = query.toUpperCase().trim();

  // Must start with SELECT or SHOW
  if (!upperQuery.startsWith('SELECT') && !upperQuery.startsWith('SHOW')) {
    throw new QueryValidationError('Only SELECT and SHOW queries are allowed');
  }

  // Check for forbidden keywords (write/DDL operations)
  for (const keyword of FORBIDDEN_KEYWORDS) {
    // Use word boundaries to avoid false positives
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(query)) {
      throw new QueryValidationError(`Forbidden keyword detected: ${keyword}`, {
        keyword,
        query: query.substring(0, 100),
      });
    }
  }

  // Additional check: SELECT INTO is not allowed (even if SELECT is there)
  if (upperQuery.includes('SELECT') && upperQuery.includes(' INTO ')) {
    throw new QueryValidationError('SELECT INTO is not allowed (write operation)', {
      query: query.substring(0, 100),
    });
  }
}

// Validate function names used in query
export function validateFunctions(query: string): void {
  // Extract function calls from query
  const functionRegex = /\b([A-Z_]+)\s*\(/g;
  const matches = query.toUpperCase().matchAll(functionRegex);

  for (const match of matches) {
    const func = match[1];

    // Skip common SQL keywords that look like functions
    if (['SELECT', 'FROM', 'WHERE', 'GROUP', 'ORDER', 'LIMIT'].includes(func)) {
      continue;
    }

    // Check if function is in whitelist
    if (!ALLOWED_FUNCTIONS.includes(func as any)) {
      throw new QueryValidationError(`Function '${func}' is not allowed`, {
        function: func,
        allowedFunctions: ALLOWED_FUNCTIONS,
      });
    }
  }
}

// Validate measurement name (prevent injection)
export function validateMeasurement(measurement: string): string {
  // Must not be empty
  if (!measurement || measurement.trim().length === 0) {
    throw new QueryValidationError('Measurement name cannot be empty');
  }

  // Check for dangerous characters
  const dangerous = /[;'"\\\x00-\x1f]/;
  if (dangerous.test(measurement)) {
    throw new QueryValidationError('Measurement name contains invalid characters', {
      measurement,
    });
  }

  // Must be quoted if contains special characters
  if (/[^\w.-]/.test(measurement)) {
    return `"${measurement.replace(/"/g, '\\"')}"`;
  }

  return measurement;
}

// Validate field name
export function validateField(field: string): string {
  if (!field || field.trim().length === 0) {
    throw new QueryValidationError('Field name cannot be empty');
  }

  // Wildcard is allowed
  if (field === '*') {
    return field;
  }

  // Check for dangerous characters
  const dangerous = /[;'"\\\x00-\x1f]/;
  if (dangerous.test(field)) {
    throw new QueryValidationError('Field name contains invalid characters', {
      field,
    });
  }

  // Must be quoted if contains special characters
  if (/[^\w.-]/.test(field)) {
    return `"${field.replace(/"/g, '\\"')}"`;
  }

  return field;
}

// Validate tag name
export function validateTag(tag: string): string {
  if (!tag || tag.trim().length === 0) {
    throw new QueryValidationError('Tag name cannot be empty');
  }

  // Check for dangerous characters
  const dangerous = /[;'"\\\x00-\x1f]/;
  if (dangerous.test(tag)) {
    throw new QueryValidationError('Tag name contains invalid characters', {
      tag,
    });
  }

  // Must be quoted if contains special characters
  if (/[^\w.-]/.test(tag)) {
    return `"${tag.replace(/"/g, '\\"')}"`;
  }

  return tag;
}

// Validate tag value (for WHERE clauses)
export function validateTagValue(value: string): string {
  // Empty values are allowed
  if (value === '') {
    return "''";
  }

  // Escape single quotes
  const escaped = value.replace(/'/g, "\\'");

  return `'${escaped}'`;
}

// Validate time window format
export function validateTimeWindow(window: string): void {
  const pattern = /^\d+[smhd]$/;
  if (!pattern.test(window)) {
    throw new QueryValidationError(
      'Invalid time window format. Must be like "1s", "5m", "1h", "1d"',
      { window }
    );
  }
}

// Validate limit value
export function validateLimit(limit: number, maxLimit: number): void {
  if (limit < 1) {
    throw new QueryValidationError('LIMIT must be at least 1', { limit });
  }

  if (limit > maxLimit) {
    throw new QueryValidationError(`LIMIT exceeds maximum of ${maxLimit}`, {
      limit,
      maxLimit,
    });
  }
}

// Complete query validation
export function validateQuery(query: string): void {
  validateReadOnly(query);
  validateFunctions(query);
}
