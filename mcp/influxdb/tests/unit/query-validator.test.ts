import { describe, it, expect } from 'vitest';
import { validateReadOnly, validateMeasurement, validateField } from '@/influx/query-validator';
import { QueryValidationError } from '@/utils/errors';

describe('Query Validator', () => {
  describe('validateReadOnly', () => {
    it('should allow SELECT queries', () => {
      expect(() => {
        validateReadOnly('SELECT * FROM cpu WHERE time > now() - 1h');
      }).not.toThrow();
    });

    it('should allow SHOW queries', () => {
      expect(() => {
        validateReadOnly('SHOW DATABASES');
      }).not.toThrow();
    });

    it('should reject DROP queries', () => {
      expect(() => {
        validateReadOnly('DROP MEASUREMENT cpu');
      }).toThrow(QueryValidationError);
    });

    it('should reject SELECT INTO queries', () => {
      expect(() => {
        validateReadOnly('SELECT * INTO backup FROM cpu');
      }).toThrow(QueryValidationError);
    });

    it('should reject DELETE queries', () => {
      expect(() => {
        validateReadOnly('DELETE FROM cpu WHERE time < now() - 1h');
      }).toThrow(QueryValidationError);
    });
  });

  describe('validateMeasurement', () => {
    it('should allow simple names', () => {
      expect(validateMeasurement('cpu')).toBe('cpu');
    });

    it('should quote names with spaces', () => {
      expect(validateMeasurement('cpu usage')).toMatch(/^".*"$/);
    });

    it('should reject empty names', () => {
      expect(() => validateMeasurement('')).toThrow(QueryValidationError);
    });
  });

  describe('validateField', () => {
    it('should allow wildcard', () => {
      expect(validateField('*')).toBe('*');
    });

    it('should allow simple names', () => {
      expect(validateField('usage_idle')).toBe('usage_idle');
    });

    it('should reject empty names', () => {
      expect(() => validateField('')).toThrow(QueryValidationError);
    });
  });
});
