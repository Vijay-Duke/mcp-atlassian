import { describe, it, expect } from 'vitest';
import { 
  validateString, 
  validateNumber, 
  validatePagination, 
  validateEnum,
  validateUserIdentification,
  validateStringArray,
  validateDateRange
} from '../../utils/input-validator.js';

describe('Input Validator', () => {
  describe('validateString', () => {
    it('should validate required string', () => {
      const result = validateString('', 'testField', { required: true });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testField is required');
    });

    it('should validate string max length', () => {
      const longString = 'a'.repeat(11);
      const result = validateString(longString, 'testField', { maxLength: 10 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testField must be 10 characters or less');
    });

    it('should validate string min length', () => {
      const result = validateString('ab', 'testField', { minLength: 3 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testField must be at least 3 characters');
    });

    it('should validate string pattern', () => {
      const result = validateString('invalid-email', 'email', { 
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('email has invalid format');
    });

    it('should sanitize HTML tags', () => {
      const result = validateString('<script>alert("xss")</script>Hello', 'testField');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('Hello');
    });

    it('should trim whitespace', () => {
      const result = validateString('  test  ', 'testField');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('test');
    });

    it('should accept valid string', () => {
      const result = validateString('Valid String', 'testField', {
        required: true,
        minLength: 5,
        maxLength: 20
      });
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('Valid String');
      expect(result.errors).toHaveLength(0);
    });

    it('should handle null and undefined', () => {
      const nullResult = validateString(null as any, 'testField');
      expect(nullResult.isValid).toBe(true);
      expect(nullResult.sanitizedValue).toBe('');

      const undefinedResult = validateString(undefined as any, 'testField');
      expect(undefinedResult.isValid).toBe(true);
      expect(undefinedResult.sanitizedValue).toBe('');
    });

    it('should fail when required field is empty after sanitization', () => {
      const result = validateString('<script></script>', 'testField', { required: true });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testField is required');
    });
  });

  describe('validateNumber', () => {
    it('should validate required number', () => {
      const result = validateNumber(undefined as any, 'testNumber', { required: true });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testNumber is required');
    });

    it('should validate minimum value', () => {
      const result = validateNumber(5, 'testNumber', { min: 10 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testNumber must be at least 10');
    });

    it('should validate maximum value', () => {
      const result = validateNumber(20, 'testNumber', { max: 10 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testNumber must be at most 10');
    });

    it('should validate integer', () => {
      const result = validateNumber(10.5, 'testNumber', { integer: true });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testNumber must be an integer');
    });

    it('should accept valid number', () => {
      const result = validateNumber(15, 'testNumber', {
        required: true,
        min: 10,
        max: 20,
        integer: true
      });
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(15);
      expect(result.errors).toHaveLength(0);
    });

    it('should convert string to number', () => {
      const result = validateNumber('42' as any, 'testNumber');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(42);
    });

    it('should reject non-numeric strings', () => {
      const result = validateNumber('not a number' as any, 'testNumber');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testNumber must be a valid number');
    });

    it('should handle NaN', () => {
      const result = validateNumber(NaN, 'testNumber');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testNumber must be a valid number');
    });

    it('should handle Infinity', () => {
      const result = validateNumber(Infinity, 'testNumber');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testNumber must be a valid number');
    });
  });

  describe('validatePagination', () => {
    it('should validate pagination with defaults', () => {
      const result = validatePagination();
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual({
        startAt: 0,
        maxResults: 50
      });
    });

    it('should validate custom pagination values', () => {
      const result = validatePagination(10, 25);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual({
        startAt: 10,
        maxResults: 25
      });
    });

    it('should reject negative start value', () => {
      const result = validatePagination(-1, 50);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('startAt must be a non-negative integer');
    });

    it('should reject maxResults below 1', () => {
      const result = validatePagination(0, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('maxResults must be an integer between 1 and 100');
    });

    it('should reject maxResults above 100', () => {
      const result = validatePagination(0, 150);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('maxResults must be an integer between 1 and 100');
    });

    it('should reject non-integer values', () => {
      const result = validatePagination(1.5, 50.5);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('startAt must be a non-negative integer');
      expect(result.errors).toContain('maxResults must be an integer between 1 and 100');
    });

    it('should handle string numbers', () => {
      const result = validatePagination('10' as any, '25' as any);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual({
        startAt: 10,
        maxResults: 25
      });
    });
  });

  describe('validateEnum', () => {
    it('should accept valid enum value', () => {
      const result = validateEnum('option1', 'testEnum', ['option1', 'option2', 'option3']);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('option1');
    });

    it('should reject invalid enum value', () => {
      const result = validateEnum('invalid', 'testEnum', ['option1', 'option2']);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testEnum must be one of: option1, option2');
    });

    it('should handle case-sensitive matching', () => {
      const result = validateEnum('OPTION1', 'testEnum', ['option1', 'option2']);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testEnum must be one of: option1, option2');
    });

    it('should handle empty value when not required', () => {
      const result = validateEnum('', 'testEnum', ['option1', 'option2'], false);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('');
    });

    it('should reject empty value when required', () => {
      const result = validateEnum('', 'testEnum', ['option1', 'option2'], true);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testEnum is required');
    });

    it('should handle undefined value', () => {
      const result = validateEnum(undefined as any, 'testEnum', ['option1']);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('');
    });

    it('should trim whitespace', () => {
      const result = validateEnum('  option1  ', 'testEnum', ['option1', 'option2']);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('option1');
    });
  });

  describe('validateUserIdentification', () => {
    it('should accept username', () => {
      const result = validateUserIdentification({ username: 'john.doe' });
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual({ username: 'john.doe' });
    });

    it('should accept accountId', () => {
      const result = validateUserIdentification({ accountId: 'user123' });
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual({ accountId: 'user123' });
    });

    it('should accept email', () => {
      const result = validateUserIdentification({ email: 'john@example.com' });
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual({ email: 'john@example.com' });
    });

    it('should accept multiple identifiers', () => {
      const result = validateUserIdentification({
        username: 'john.doe',
        accountId: 'user123',
        email: 'john@example.com'
      });
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual({
        username: 'john.doe',
        accountId: 'user123',
        email: 'john@example.com'
      });
    });

    it('should reject when no identifier provided', () => {
      const result = validateUserIdentification({});
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one of username, accountId, or email must be provided');
    });

    it('should sanitize identifiers', () => {
      const result = validateUserIdentification({
        username: '  john.doe  ',
        email: '<script>test@example.com</script>'
      });
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual({
        username: 'john.doe',
        email: 'test@example.com'
      });
    });

    it('should handle null/undefined values', () => {
      const result = validateUserIdentification({
        username: null as any,
        accountId: undefined,
        email: ''
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one of username, accountId, or email must be provided');
    });
  });

  describe('validateStringArray', () => {
    it('should accept valid string array', () => {
      const result = validateStringArray(['item1', 'item2', 'item3'], 'testArray');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual(['item1', 'item2', 'item3']);
    });

    it('should validate max items', () => {
      const result = validateStringArray(['a', 'b', 'c', 'd'], 'testArray', { maxItems: 3 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testArray must contain at most 3 items');
    });

    it('should validate min items', () => {
      const result = validateStringArray(['a'], 'testArray', { minItems: 2 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testArray must contain at least 2 items');
    });

    it('should validate required array', () => {
      const result = validateStringArray([], 'testArray', { required: true });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testArray is required and must not be empty');
    });

    it('should sanitize array items', () => {
      const result = validateStringArray(
        ['  item1  ', '<script>item2</script>', 'item3'],
        'testArray'
      );
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual(['item1', 'item2', 'item3']);
    });

    it('should filter empty strings', () => {
      const result = validateStringArray(['item1', '', '  ', 'item2'], 'testArray');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual(['item1', 'item2']);
    });

    it('should handle non-array input', () => {
      const result = validateStringArray('not an array' as any, 'testArray');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testArray must be an array');
    });

    it('should handle null/undefined', () => {
      const nullResult = validateStringArray(null as any, 'testArray');
      expect(nullResult.isValid).toBe(true);
      expect(nullResult.sanitizedValue).toEqual([]);

      const undefinedResult = validateStringArray(undefined as any, 'testArray');
      expect(undefinedResult.isValid).toBe(true);
      expect(undefinedResult.sanitizedValue).toEqual([]);
    });

    it('should convert non-string items to strings', () => {
      const result = validateStringArray([1, true, 'test'] as any, 'testArray');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual(['1', 'true', 'test']);
    });
  });

  describe('validateDateRange', () => {
    it('should accept valid date range', () => {
      const result = validateDateRange('2024-01-01', '2024-12-31');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual({
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      });
    });

    it('should accept start date only', () => {
      const result = validateDateRange('2024-01-01', undefined);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual({
        startDate: '2024-01-01',
        endDate: undefined
      });
    });

    it('should accept end date only', () => {
      const result = validateDateRange(undefined, '2024-12-31');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual({
        startDate: undefined,
        endDate: '2024-12-31'
      });
    });

    it('should reject when end date is before start date', () => {
      const result = validateDateRange('2024-12-31', '2024-01-01');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('startDate must be before endDate');
    });

    it('should validate date format', () => {
      const result = validateDateRange('2024-13-01', '2024-12-32');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('startDate must be a valid date in YYYY-MM-DD format');
      expect(result.errors).toContain('endDate must be a valid date in YYYY-MM-DD format');
    });

    it('should validate invalid date format', () => {
      const result = validateDateRange('01-01-2024', '12/31/2024');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('startDate must be a valid date in YYYY-MM-DD format');
      expect(result.errors).toContain('endDate must be a valid date in YYYY-MM-DD format');
    });

    it('should handle empty strings', () => {
      const result = validateDateRange('', '');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual({
        startDate: undefined,
        endDate: undefined
      });
    });

    it('should handle null values', () => {
      const result = validateDateRange(null as any, null as any);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual({
        startDate: undefined,
        endDate: undefined
      });
    });

    it('should accept same start and end date', () => {
      const result = validateDateRange('2024-06-15', '2024-06-15');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual({
        startDate: '2024-06-15',
        endDate: '2024-06-15'
      });
    });

    it('should validate leap year dates', () => {
      const result = validateDateRange('2024-02-29', '2024-03-01');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual({
        startDate: '2024-02-29',
        endDate: '2024-03-01'
      });
    });

    it('should reject invalid leap year date', () => {
      const result = validateDateRange('2023-02-29', '2023-03-01');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('startDate must be a valid date in YYYY-MM-DD format');
    });
  });
});