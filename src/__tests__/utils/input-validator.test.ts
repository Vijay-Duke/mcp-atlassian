import { describe, it, expect } from 'vitest';
import { 
  validateString, 
  validateNumber, 
  validatePagination, 
  validateEnum,
  validateUserIdentification,
  validateStringArray,
  validateDateRange,
  validateDateString
} from '../../utils/input-validator.js';

describe('Input Validator', () => {
  describe('validateString', () => {
    it('should validate required string', () => {
      const result = validateString(undefined, 'testField', { required: true });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testField is required');
    });

    it('should validate string max length', () => {
      const longString = 'a'.repeat(11);
      const result = validateString(longString, 'testField', { maxLength: 10 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testField cannot exceed 10 characters');
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

    it('should not sanitize HTML tags (just validate)', () => {
      const result = validateString('<script>alert("xss")</script>Hello', 'testField');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('<script>alert("xss")</script>Hello');
    });

    it('should not trim whitespace (just validate)', () => {
      const result = validateString('  test  ', 'testField');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('  test  ');
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

    it('should handle null and undefined for optional fields', () => {
      const nullResult = validateString(null as any, 'testField');
      expect(nullResult.isValid).toBe(true);
      expect(nullResult.sanitizedValue).toBe(undefined);

      const undefinedResult = validateString(undefined as any, 'testField');
      expect(undefinedResult.isValid).toBe(true);
      expect(undefinedResult.sanitizedValue).toBe(undefined);
    });

    it('should reject empty string when allowEmpty is false', () => {
      const result = validateString('', 'testField', { allowEmpty: false });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testField cannot be empty');
    });

    it('should accept empty string when allowEmpty is true', () => {
      const result = validateString('', 'testField', { allowEmpty: true });
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('');
    });

    it('should reject non-string values', () => {
      const result = validateString(123 as any, 'testField');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testField must be a string');
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
      expect(result.errors).toContain('testNumber cannot exceed 10');
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

    it('should reject non-numeric values', () => {
      const result = validateNumber('not a number' as any, 'testNumber');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testNumber must be a valid number');
    });

    it('should handle NaN', () => {
      const result = validateNumber(NaN, 'testNumber');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testNumber must be a valid number');
    });

    it('should handle optional number fields', () => {
      const result = validateNumber(undefined, 'testNumber');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(undefined);
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

    it('should handle undefined value when not required', () => {
      const result = validateEnum(undefined as any, 'testEnum', ['option1', 'option2'], false);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(undefined);
    });

    it('should reject undefined value when required', () => {
      const result = validateEnum(undefined as any, 'testEnum', ['option1', 'option2'], true);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testEnum is required');
    });

    it('should reject non-string values', () => {
      const result = validateEnum(123 as any, 'testEnum', ['option1', 'option2']);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testEnum must be a string');
    });
  });

  describe('validateUserIdentification', () => {
    it('should accept username', () => {
      const result = validateUserIdentification({ username: 'john.doe' });
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual({ username: 'john.doe' });
    });

    it('should accept accountId', () => {
      const result = validateUserIdentification({ accountId: 'user123456789' });
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual({ accountId: 'user123456789' });
    });

    it('should reject email (privacy)', () => {
      const result = validateUserIdentification({ email: 'john@example.com' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email-based user lookup is disabled for privacy reasons. Please use accountId instead.');
    });

    it('should accept both username and accountId', () => {
      const result = validateUserIdentification({
        username: 'john.doe',
        accountId: 'user123456789'
      });
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual({
        username: 'john.doe',
        accountId: 'user123456789'
      });
    });

    it('should reject when no identifier provided', () => {
      const result = validateUserIdentification({});
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one user identifier (username, accountId, or email) is required');
    });

    it('should validate accountId pattern', () => {
      const result = validateUserIdentification({ accountId: 'invalid@id!' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('accountId has invalid format');
    });

    it('should validate accountId length', () => {
      const result = validateUserIdentification({ accountId: 'short' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('accountId must be at least 10 characters');
    });

    it('should validate username pattern', () => {
      const result = validateUserIdentification({ username: 'invalid username!' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('username has invalid format');
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
      expect(result.errors).toContain('testArray cannot have more than 3 items');
    });

    it('should validate required array', () => {
      const result = validateStringArray(undefined, 'testArray', { required: true });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testArray is required');
    });

    it('should reject empty array when not allowed', () => {
      const result = validateStringArray([], 'testArray', { allowEmpty: false });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testArray cannot be empty');
    });

    it('should accept empty array when allowed', () => {
      const result = validateStringArray([], 'testArray', { allowEmpty: true });
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual([]);
    });

    it('should handle non-array input', () => {
      const result = validateStringArray('not an array' as any, 'testArray');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testArray must be an array');
    });

    it('should handle null/undefined for optional fields', () => {
      const nullResult = validateStringArray(null as any, 'testArray');
      expect(nullResult.isValid).toBe(true);
      expect(nullResult.sanitizedValue).toBe(undefined);

      const undefinedResult = validateStringArray(undefined as any, 'testArray');
      expect(undefinedResult.isValid).toBe(true);
      expect(undefinedResult.sanitizedValue).toBe(undefined);
    });

    it('should validate individual string items', () => {
      const result = validateStringArray([123, 'valid'] as any, 'testArray');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testArray[0] must be a string');
    });

    it('should validate string length in items', () => {
      const longString = 'a'.repeat(101);
      const result = validateStringArray([longString], 'testArray', { maxLength: 100 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testArray[0] cannot exceed 100 characters');
    });

    it('should validate pattern in items', () => {
      const result = validateStringArray(['valid', 'invalid!'], 'testArray', { 
        pattern: /^[a-zA-Z0-9]+$/ 
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testArray[1] has invalid format: invalid!');
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
      expect(result.errors).toContain('startDate must be before or equal to endDate');
    });

    it('should validate date format', () => {
      const result = validateDateRange('2024-13-01', '2024-12-32');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('startDate is not a valid date: 2024-13-01');
      expect(result.errors).toContain('endDate is not a valid date: 2024-12-32');
    });

    it('should validate invalid date format', () => {
      const result = validateDateRange('01-01-2024', '12/31/2024');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('startDate must be in YYYY-MM-DD format');
      expect(result.errors).toContain('endDate must be in YYYY-MM-DD format');
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
      expect(result.errors).toContain('startDate is not a valid date: 2023-02-29');
    });

    it('should reject date range exceeding 5 years', () => {
      const result = validateDateRange('2020-01-01', '2026-01-01');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Date range cannot exceed 5 years for performance reasons');
    });
  });

  describe('validateDateString', () => {
    it('should accept valid date', () => {
      const result = validateDateString('2024-06-15', 'testDate');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('2024-06-15');
    });

    it('should reject invalid format', () => {
      const result = validateDateString('06/15/2024', 'testDate');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testDate must be in YYYY-MM-DD format');
    });

    it('should reject invalid date', () => {
      const result = validateDateString('2024-13-45', 'testDate');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testDate is not a valid date: 2024-13-45');
    });

    it('should reject non-string input', () => {
      const result = validateDateString(20240615 as any, 'testDate');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testDate must be a string');
    });

    it('should reject dates outside reasonable range', () => {
      const result = validateDateString('1800-01-01', 'testDate');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('testDate must be between 1900-01-01 and');
    });
  });
});