import { Logger } from './logger.js';

export interface ValidationResult<T = any> {
  isValid: boolean;
  validatedArgs?: T;
  errors?: string[];
}

export type ValidatorFunction<T = any> = (args: any) => ValidationResult<T>;

export function createValidator<T>(
  schema: Record<string, (value: any) => { valid: boolean; error?: string; value?: any }>
): ValidatorFunction<T> {
  return (args: any): ValidationResult<T> => {
    if (!args || typeof args !== 'object') {
      return {
        isValid: false,
        errors: ['Arguments must be an object'],
      };
    }

    const errors: string[] = [];
    const validatedArgs: any = {};

    for (const [key, validator] of Object.entries(schema)) {
      const value = args[key];
      const result = validator(value);

      if (!result.valid) {
        if (result.error) {
          errors.push(`${key}: ${result.error}`);
        }
      } else {
        validatedArgs[key] = result.value !== undefined ? result.value : value;
      }
    }

    if (errors.length > 0) {
      Logger.debug('Validation failed', { errors, args: sanitizeForLog(args) });
      return {
        isValid: false,
        errors,
      };
    }

    return {
      isValid: true,
      validatedArgs: validatedArgs as T,
    };
  };
}

// Common field validators
export const validators = {
  required: (fieldName: string) => (value: any) => ({
    valid: value !== undefined && value !== null && value !== '',
    error:
      value === undefined || value === null || value === ''
        ? `${fieldName} is required`
        : undefined,
  }),

  optional: () => (value: any) => ({ valid: true }),

  string:
    (fieldName: string, minLength = 0, maxLength = Infinity) =>
    (value: any) => {
      if (value === undefined || value === null) return { valid: true };
      if (typeof value !== 'string') {
        return { valid: false, error: `${fieldName} must be a string` };
      }
      if (value.length < minLength) {
        return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
      }
      if (value.length > maxLength) {
        return { valid: false, error: `${fieldName} must be at most ${maxLength} characters` };
      }
      return { valid: true, value: value.trim() };
    },

  number:
    (fieldName: string, min = -Infinity, max = Infinity) =>
    (value: any) => {
      if (value === undefined || value === null) return { valid: true };
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (typeof num !== 'number' || isNaN(num)) {
        return { valid: false, error: `${fieldName} must be a number` };
      }
      if (num < min || num > max) {
        return { valid: false, error: `${fieldName} must be between ${min} and ${max}` };
      }
      return { valid: true, value: num };
    },

  boolean: (fieldName: string) => (value: any) => {
    if (value === undefined || value === null) return { valid: true };
    if (typeof value === 'boolean') return { valid: true };
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true') return { valid: true, value: true };
      if (lower === 'false') return { valid: true, value: false };
    }
    return { valid: false, error: `${fieldName} must be a boolean` };
  },

  enum: (fieldName: string, allowedValues: string[]) => (value: any) => {
    if (value === undefined || value === null) return { valid: true };
    if (typeof value !== 'string') {
      return { valid: false, error: `${fieldName} must be a string` };
    }
    if (!allowedValues.includes(value)) {
      return {
        valid: false,
        error: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      };
    }
    return { valid: true };
  },

  array:
    (fieldName: string, itemValidator?: (value: any) => { valid: boolean; error?: string }) =>
    (value: any) => {
      if (value === undefined || value === null) return { valid: true };
      if (!Array.isArray(value)) {
        return { valid: false, error: `${fieldName} must be an array` };
      }
      if (itemValidator) {
        for (let i = 0; i < value.length; i++) {
          const itemResult = itemValidator(value[i]);
          if (!itemResult.valid) {
            return {
              valid: false,
              error: `${fieldName}[${i}]: ${itemResult.error}`,
            };
          }
        }
      }
      return { valid: true };
    },

  object: (fieldName: string) => (value: any) => {
    if (value === undefined || value === null) return { valid: true };
    if (typeof value !== 'object' || Array.isArray(value)) {
      return { valid: false, error: `${fieldName} must be an object` };
    }
    return { valid: true };
  },

  oneOfRequired: (fieldName: string, alternatives: string[]) => (value: any, args: any) => {
    const hasValue = value !== undefined && value !== null && value !== '';
    const hasAlternatives = alternatives.some(
      (alt) => args[alt] !== undefined && args[alt] !== null && args[alt] !== ''
    );

    if (!hasValue && !hasAlternatives) {
      return {
        valid: false,
        error: `Either ${fieldName} or one of [${alternatives.join(', ')}] must be provided`,
      };
    }

    return { valid: true };
  },
};

function sanitizeForLog(args: any): Record<string, any> {
  if (!args || typeof args !== 'object') return {};

  const sanitized = { ...args };
  const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authorization'];

  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}
