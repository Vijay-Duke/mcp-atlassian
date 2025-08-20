import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createValidator, validators, type ValidationResult } from '../../utils/argument-validator.js';

describe('ArgumentValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createValidator', () => {
    it('should validate valid arguments', () => {
      const validator = createValidator({
        name: validators.required('name'),
        age: validators.number('age', 0, 150)
      });

      const result = validator({ name: 'John', age: 25 });
      expect(result.isValid).toBe(true);
      expect(result.validatedArgs).toEqual({ name: 'John', age: 25 });
    });

    it('should reject non-object arguments', () => {
      const validator = createValidator({
        name: validators.required('name')
      });

      const result = validator(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(['Arguments must be an object']);
    });

    it('should collect validation errors', () => {
      const validator = createValidator({
        name: validators.required('name'),
        age: validators.number('age', 0, 150)
      });

      const result = validator({ name: '', age: 'invalid' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('name: name is required');
      expect(result.errors).toContain('age: age must be a number');
    });

    it('should use transformed values when provided', () => {
      const validator = createValidator({
        name: validators.string('name')
      });

      const result = validator({ name: '  John  ' });
      expect(result.isValid).toBe(true);
      expect((result.validatedArgs as any)?.name).toBe('John');
    });
  });

  describe('validators.required', () => {
    it('should validate non-empty values', () => {
      const validator = validators.required('test');
      expect(validator('value').valid).toBe(true);
      expect(validator(0).valid).toBe(true);
      expect(validator(false).valid).toBe(true);
    });

    it('should reject empty values', () => {
      const validator = validators.required('test');
      expect(validator('').valid).toBe(false);
      expect(validator(null).valid).toBe(false);
      expect(validator(undefined).valid).toBe(false);
    });
  });

  describe('validators.optional', () => {
    it('should always return valid', () => {
      const validator = validators.optional();
      expect(validator(undefined).valid).toBe(true);
      expect(validator(null).valid).toBe(true);
      expect(validator('value').valid).toBe(true);
    });
  });

  describe('validators.string', () => {
    it('should validate strings and trim them', () => {
      const validator = validators.string('test');
      const result = validator('  hello  ');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('hello');
    });

    it('should reject non-strings', () => {
      const validator = validators.string('test');
      expect(validator(123).valid).toBe(false);
      expect(validator(123).error).toBe('test must be a string');
    });

    it('should validate string length', () => {
      const validator = validators.string('test', 2, 5);
      expect(validator('ab').valid).toBe(true);
      expect(validator('a').valid).toBe(false);
      expect(validator('abcdef').valid).toBe(false);
    });

    it('should allow null/undefined for optional strings', () => {
      const validator = validators.string('test');
      expect(validator(null).valid).toBe(true);
      expect(validator(undefined).valid).toBe(true);
    });
  });

  describe('validators.number', () => {
    it('should validate numbers', () => {
      const validator = validators.number('test');
      expect(validator(123).valid).toBe(true);
      expect(validator(123.45).valid).toBe(true);
    });

    it('should parse string numbers', () => {
      const validator = validators.number('test');
      const result = validator('123');
      expect(result.valid).toBe(true);
      expect(result.value).toBe(123);
    });

    it('should reject invalid numbers', () => {
      const validator = validators.number('test');
      expect(validator('abc').valid).toBe(false);
      expect(validator(NaN).valid).toBe(false);
    });

    it('should validate number range', () => {
      const validator = validators.number('test', 0, 100);
      expect(validator(50).valid).toBe(true);
      expect(validator(-1).valid).toBe(false);
      expect(validator(101).valid).toBe(false);
    });

    it('should allow null/undefined for optional numbers', () => {
      const validator = validators.number('test');
      expect(validator(null).valid).toBe(true);
      expect(validator(undefined).valid).toBe(true);
    });
  });

  describe('validators.boolean', () => {
    it('should validate boolean values', () => {
      const validator = validators.boolean('test');
      expect(validator(true).valid).toBe(true);
      expect(validator(false).valid).toBe(true);
    });

    it('should parse string booleans', () => {
      const validator = validators.boolean('test');
      expect(validator('true').value).toBe(true);
      expect(validator('false').value).toBe(false);
      expect(validator('TRUE').value).toBe(true);
      expect(validator('FALSE').value).toBe(false);
    });

    it('should reject invalid boolean strings', () => {
      const validator = validators.boolean('test');
      expect(validator('yes').valid).toBe(false);
      expect(validator('no').valid).toBe(false);
      expect(validator('1').valid).toBe(false);
    });

    it('should allow null/undefined for optional booleans', () => {
      const validator = validators.boolean('test');
      expect(validator(null).valid).toBe(true);
      expect(validator(undefined).valid).toBe(true);
    });
  });

  describe('validators.enum', () => {
    it('should validate allowed values', () => {
      const validator = validators.enum('test', ['red', 'green', 'blue']);
      expect(validator('red').valid).toBe(true);
      expect(validator('green').valid).toBe(true);
      expect(validator('blue').valid).toBe(true);
    });

    it('should reject disallowed values', () => {
      const validator = validators.enum('test', ['red', 'green', 'blue']);
      const result = validator('yellow');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('test must be one of: red, green, blue');
    });

    it('should reject non-string values', () => {
      const validator = validators.enum('test', ['red', 'green', 'blue']);
      expect(validator(123).valid).toBe(false);
    });

    it('should allow null/undefined for optional enums', () => {
      const validator = validators.enum('test', ['red', 'green', 'blue']);
      expect(validator(null).valid).toBe(true);
      expect(validator(undefined).valid).toBe(true);
    });
  });

  describe('validators.array', () => {
    it('should validate arrays', () => {
      const validator = validators.array('test');
      expect(validator([1, 2, 3]).valid).toBe(true);
      expect(validator([]).valid).toBe(true);
    });

    it('should reject non-arrays', () => {
      const validator = validators.array('test');
      expect(validator('not array').valid).toBe(false);
      expect(validator({}).valid).toBe(false);
    });

    it('should validate array items when itemValidator provided', () => {
      const itemValidator = (value: any) => ({
        valid: typeof value === 'string',
        error: typeof value === 'string' ? undefined : 'must be string'
      });
      const validator = validators.array('test', itemValidator);
      
      expect(validator(['a', 'b', 'c']).valid).toBe(true);
      const result = validator(['a', 123, 'c']);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('test[1]: must be string');
    });

    it('should allow null/undefined for optional arrays', () => {
      const validator = validators.array('test');
      expect(validator(null).valid).toBe(true);
      expect(validator(undefined).valid).toBe(true);
    });
  });

  describe('validators.object', () => {
    it('should validate objects', () => {
      const validator = validators.object('test');
      expect(validator({}).valid).toBe(true);
      expect(validator({ key: 'value' }).valid).toBe(true);
    });

    it('should reject non-objects', () => {
      const validator = validators.object('test');
      expect(validator('string').valid).toBe(false);
      expect(validator([]).valid).toBe(false);
      expect(validator(123).valid).toBe(false);
    });

    it('should allow null/undefined for optional objects', () => {
      const validator = validators.object('test');
      expect(validator(null).valid).toBe(true);
      expect(validator(undefined).valid).toBe(true);
    });
  });

  describe('validators.oneOfRequired', () => {
    it('should pass when main field has value', () => {
      const validator = validators.oneOfRequired('username', ['email', 'phoneNumber']);
      const result = validator('john_doe', { username: 'john_doe', email: '', phoneNumber: '' });
      expect(result.valid).toBe(true);
    });

    it('should pass when alternative field has value', () => {
      const validator = validators.oneOfRequired('username', ['email', 'phoneNumber']);
      const result = validator('', { username: '', email: 'john@example.com', phoneNumber: '' });
      expect(result.valid).toBe(true);
    });

    it('should pass when multiple alternatives have values', () => {
      const validator = validators.oneOfRequired('username', ['email', 'phoneNumber']);
      const result = validator('', { username: '', email: 'john@example.com', phoneNumber: '123-456-7890' });
      expect(result.valid).toBe(true);
    });

    it('should fail when no fields have values', () => {
      const validator = validators.oneOfRequired('username', ['email', 'phoneNumber']);
      const result = validator('', { username: '', email: '', phoneNumber: '' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Either username or one of [email, phoneNumber] must be provided');
    });

    it('should fail when fields are null/undefined', () => {
      const validator = validators.oneOfRequired('username', ['email', 'phoneNumber']);
      const result = validator(null, { username: null, email: undefined, phoneNumber: null });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Either username or one of [email, phoneNumber] must be provided');
    });

    it('should pass when main field is 0 (falsy but valid)', () => {
      const validator = validators.oneOfRequired('count', ['backup']);
      const result = validator(0, { count: 0, backup: '' });
      expect(result.valid).toBe(true);
    });

    it('should pass when main field is false (falsy but valid)', () => {
      const validator = validators.oneOfRequired('enabled', ['fallback']);
      const result = validator(false, { enabled: false, fallback: '' });
      expect(result.valid).toBe(true);
    });
  });
});