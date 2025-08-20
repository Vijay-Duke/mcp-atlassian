import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  withHandlerWrapper,
  withSimpleWrapper,
  withPerformanceMonitoring,
  type HandlerContext,
  type HandlerOptions,
  type HandlerFunction,
  type ValidatorFunction,
} from '../../utils/handler-wrapper.js';
import { Logger } from '../../utils/logger.js';
import { formatApiError } from '../../utils/http-client.js';
import { createValidationError } from '../../utils/error-handler.js';

// Mock dependencies
vi.mock('../../utils/logger.js', () => ({
  Logger: {
    logRequest: vi.fn(),
    logResponse: vi.fn(),
    logPerformance: vi.fn(),
    logError: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../../utils/http-client.js', () => ({
  formatApiError: vi.fn().mockReturnValue('Formatted API error'),
}));

vi.mock('../../utils/error-handler.js', () => ({
  createValidationError: vi.fn().mockReturnValue({
    content: [{ type: 'text', text: 'Validation error' }],
    isError: true,
  }),
}));

describe('HandlerWrapper', () => {
  let mockHandler: HandlerFunction<any>;
  let mockValidator: ValidatorFunction<any>;
  let context: HandlerContext;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01T00:00:00Z'));

    mockHandler = vi.fn().mockResolvedValue({ success: true, data: 'test result' });
    mockValidator = vi.fn().mockReturnValue({
      isValid: true,
      validatedArgs: { validated: true },
    });

    context = {
      operation: 'test-operation',
      tool: 'test-tool',
      userId: 'user123',
      requestId: 'req456',
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('withHandlerWrapper', () => {
    it('should execute handler successfully with valid input', async () => {
      const wrappedHandler = withHandlerWrapper(context, mockValidator, mockHandler);
      const args = { input: 'test' };

      vi.advanceTimersByTime(100); // Simulate 100ms execution time
      const result = await wrappedHandler(args);

      expect(mockValidator).toHaveBeenCalledWith(args);
      expect(mockHandler).toHaveBeenCalledWith({ validated: true });
      expect(Logger.logRequest).toHaveBeenCalledWith('test-operation', {
        tool: 'test-tool',
        userId: 'user123',
        requestId: 'req456',
      });
      expect(Logger.logResponse).toHaveBeenCalledWith('test-operation', expect.any(Number), {
        tool: 'test-tool',
        userId: 'user123',
        requestId: 'req456',
      });
      expect(Logger.logPerformance).toHaveBeenCalledWith('test-operation', expect.any(Number), {
        tool: 'test-tool',
        userId: 'user123',
        requestId: 'req456',
      });
      expect(result).toEqual({
        content: [{ type: 'text', text: '{\n  "success": true,\n  "data": "test result"\n}' }],
      });
    });

    it('should handle validation errors', async () => {
      const failingValidator = vi.fn().mockReturnValue({
        isValid: false,
        errors: ['Missing field', 'Invalid format'],
      });

      const wrappedHandler = withHandlerWrapper(context, failingValidator, mockHandler);
      const args = { invalid: 'data' };

      const result = await wrappedHandler(args);

      expect(failingValidator).toHaveBeenCalledWith(args);
      expect(mockHandler).not.toHaveBeenCalled();
      expect(Logger.logError).toHaveBeenCalledWith(
        'test-operation-validation',
        expect.any(Error),
        {
          tool: 'test-tool',
          userId: 'user123',
          requestId: 'req456',
          validationErrors: ['Missing field', 'Invalid format'],
        }
      );
      expect(createValidationError).toHaveBeenCalledWith(
        ['Missing field', 'Invalid format'],
        'test-operation',
        'confluence'
      );
      expect(result).toEqual({
        content: [{ type: 'text', text: 'Validation error' }],
        isError: true,
      });
    });

    it('should handle validation errors with no errors array', async () => {
      const failingValidator = vi.fn().mockReturnValue({
        isValid: false,
        // No errors array provided
      });

      const wrappedHandler = withHandlerWrapper(context, failingValidator, mockHandler);
      const result = await wrappedHandler({});

      expect(createValidationError).toHaveBeenCalledWith([], 'test-operation', 'confluence');
    });

    it('should return structured data when option is enabled', async () => {
      const options: HandlerOptions = { returnStructuredData: true };
      const wrappedHandler = withHandlerWrapper(context, mockValidator, mockHandler, options);

      const result = await wrappedHandler({});

      expect(result).toEqual({
        content: [{ type: 'text', text: '{\n  "success": true,\n  "data": "test result"\n}' }],
      });
    });

    it('should handle string results', async () => {
      const stringHandler = vi.fn().mockResolvedValue('Simple string result');
      const wrappedHandler = withHandlerWrapper(context, mockValidator, stringHandler);

      const result = await wrappedHandler({});

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Simple string result' }],
      });
    });

    it('should handle CallToolResult objects', async () => {
      const callToolResult: CallToolResult = {
        content: [{ type: 'text', text: 'Already formatted result' }],
      };
      const resultHandler = vi.fn().mockResolvedValue(callToolResult);
      const wrappedHandler = withHandlerWrapper(context, mockValidator, resultHandler);

      const result = await wrappedHandler({});

      expect(result).toEqual(callToolResult);
    });

    it('should disable performance logging when option is false', async () => {
      const options: HandlerOptions = { logPerformance: false };
      const wrappedHandler = withHandlerWrapper(context, mockValidator, mockHandler, options);

      await wrappedHandler({});

      expect(Logger.logResponse).toHaveBeenCalled();
      expect(Logger.logPerformance).not.toHaveBeenCalled();
    });

    it('should disable response sanitization when option is false', async () => {
      const options: HandlerOptions = { sanitizeResponse: false };
      const sensitiveHandler = vi.fn().mockResolvedValue({
        password: 'secret123',
        data: 'result',
      });
      const wrappedHandler = withHandlerWrapper(context, mockValidator, sensitiveHandler, options);

      const result = await wrappedHandler({});

      expect(result.content[0].text).toContain('"password": "secret123"');
    });

    it('should sanitize response data by default', async () => {
      const sensitiveHandler = vi.fn().mockResolvedValue({
        password: 'secret123',
        token: 'token456',
        data: 'result',
      });
      const wrappedHandler = withHandlerWrapper(context, mockValidator, sensitiveHandler);

      const result = await wrappedHandler({});

      expect(result.content[0].text).toContain('"password": "[REDACTED]"');
      expect(result.content[0].text).toContain('"token": "[REDACTED]"');
      expect(result.content[0].text).toContain('"data": "result"');
    });

    it('should handle nested sensitive data in response', async () => {
      const nestedHandler = vi.fn().mockResolvedValue({
        user: {
          name: 'John',
          credentials: {
            password: 'secret',
            apiKey: 'key123',
          },
        },
        items: [
          { name: 'Item 1', secret: 'hidden' },
          { name: 'Item 2', authorization: 'Bearer token' },
        ],
      });
      const wrappedHandler = withHandlerWrapper(context, mockValidator, nestedHandler);

      const result = await wrappedHandler({});
      const responseText = result.content[0].text;

      expect(responseText).toContain('"name": "John"');
      expect(responseText).toContain('"credentials": "[REDACTED]"');
      expect(responseText).toContain('"secret": "[REDACTED]"');
      expect(responseText).toContain('"authorization": "[REDACTED]"');
    });

    it('should handle API errors with response', async () => {
      const apiError = {
        response: { status: 404 },
        isAxiosError: true,
        message: 'Not Found',
      };
      const errorHandler = vi.fn().mockRejectedValue(apiError);
      const wrappedHandler = withHandlerWrapper(context, mockValidator, errorHandler);

      const result = await wrappedHandler({});

      expect(formatApiError).toHaveBeenCalledWith(apiError);
      expect(result).toEqual({
        content: [{ type: 'text', text: 'Formatted API error' }],
        isError: true,
      });
      expect(Logger.logError).toHaveBeenCalledWith('test-operation', apiError, {
        tool: 'test-tool',
        userId: 'user123',
        requestId: 'req456',
        duration: expect.any(Number),
        errorType: 'Object',
      });
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Something went wrong');
      const errorHandler = vi.fn().mockRejectedValue(genericError);
      const wrappedHandler = withHandlerWrapper(context, mockValidator, errorHandler);

      const result = await wrappedHandler({});

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Something went wrong' }],
        isError: true,
      });
      expect(Logger.logError).toHaveBeenCalledWith('test-operation', genericError, {
        tool: 'test-tool',
        userId: 'user123',
        requestId: 'req456',
        duration: expect.any(Number),
        errorType: 'Error',
      });
    });

    it('should handle non-Error exceptions', async () => {
      const stringError = 'String error';
      const errorHandler = vi.fn().mockRejectedValue(stringError);
      const wrappedHandler = withHandlerWrapper(context, mockValidator, errorHandler);

      const result = await wrappedHandler({});

      expect(result).toEqual({
        content: [{ type: 'text', text: 'An unknown error occurred' }],
        isError: true,
      });
    });

    it('should work with minimal context', async () => {
      const minimalContext: HandlerContext = {
        operation: 'test',
        tool: 'tool',
      };
      const wrappedHandler = withHandlerWrapper(minimalContext, mockValidator, mockHandler);

      const result = await wrappedHandler({});

      expect(Logger.logRequest).toHaveBeenCalledWith('test', {
        tool: 'tool',
        userId: undefined,
        requestId: undefined,
      });
      expect(result.isError).toBeUndefined();
    });

    it('should handle invalid JSON in sanitization gracefully', async () => {
      // Create a handler that returns circular reference (invalid JSON)
      const circularObject: any = { data: 'test' };
      circularObject.circular = circularObject;
      
      // Mock JSON.stringify to throw an error (simulating circular reference)
      const originalStringify = JSON.stringify;
      vi.spyOn(JSON, 'stringify').mockImplementationOnce(() => {
        throw new Error('Converting circular structure to JSON');
      });

      const circularHandler = vi.fn().mockResolvedValue(circularObject);
      const wrappedHandler = withHandlerWrapper(context, mockValidator, circularHandler);

      const result = await wrappedHandler({});

      expect(Logger.logError).toHaveBeenCalled();
      
      // Restore original stringify
      JSON.stringify = originalStringify;
    });
  });

  describe('withSimpleWrapper', () => {
    it('should create a wrapper with no validation', async () => {
      const wrappedHandler = withSimpleWrapper('simple-op', 'simple-tool', mockHandler);
      const args = { input: 'test' };

      const result = await wrappedHandler(args);

      expect(mockHandler).toHaveBeenCalledWith(args);
      expect(Logger.logRequest).toHaveBeenCalledWith('simple-op', {
        tool: 'simple-tool',
        userId: undefined,
        requestId: undefined,
      });
      expect(result.isError).toBeUndefined();
    });

    it('should pass through all options', async () => {
      const options: HandlerOptions = {
        returnStructuredData: true,
        logPerformance: false,
        sanitizeResponse: false,
      };
      const wrappedHandler = withSimpleWrapper('simple-op', 'simple-tool', mockHandler, options);

      await wrappedHandler({});

      expect(Logger.logPerformance).not.toHaveBeenCalled();
    });
  });

  describe('withPerformanceMonitoring', () => {
    it('should monitor successful function execution', async () => {
      const testFunction = vi.fn().mockResolvedValue('success');
      const monitoredFunction = withPerformanceMonitoring('perf-test', testFunction);

      vi.advanceTimersByTime(150); // Simulate 150ms execution
      const result = await monitoredFunction('arg1', 'arg2');

      expect(testFunction).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result).toBe('success');
      expect(Logger.logPerformance).toHaveBeenCalledWith('perf-test', expect.any(Number));
    });

    it('should monitor failed function execution', async () => {
      const error = new Error('Function failed');
      const testFunction = vi.fn().mockRejectedValue(error);
      const monitoredFunction = withPerformanceMonitoring('perf-test', testFunction);

      vi.advanceTimersByTime(75); // Simulate 75ms before failure
      
      await expect(monitoredFunction()).rejects.toThrow('Function failed');

      expect(Logger.logError).toHaveBeenCalledWith('perf-test', error, {
        duration: expect.any(Number),
      });
      expect(Logger.logPerformance).not.toHaveBeenCalled();
    });

    it('should preserve function signature and behavior', async () => {
      const originalFunction = async (a: number, b: string): Promise<string> => {
        return `${a}-${b}`;
      };
      
      const monitoredFunction = withPerformanceMonitoring('test', originalFunction);
      const result = await monitoredFunction(42, 'test');

      expect(result).toBe('42-test');
    });
  });

  describe('response sanitization edge cases', () => {
    it('should handle invalid JSON in sanitizeResponseData', async () => {
      // Create a handler that should trigger the JSON parsing failure path
      const invalidJsonHandler = vi.fn().mockImplementation(() => {
        // Return something that when JSON.stringify is called later will be valid,
        // but we'll mock the parsing in sanitizeResponseData to fail
        return Promise.resolve({ test: 'data' });
      });

      // Mock JSON.parse to fail in the sanitizeResponseData function
      const originalParse = JSON.parse;
      vi.spyOn(JSON, 'parse').mockImplementationOnce(() => {
        throw new Error('Invalid JSON');
      });

      const wrappedHandler = withHandlerWrapper(context, mockValidator, invalidJsonHandler);
      const result = await wrappedHandler({});

      expect(Logger.warn).toHaveBeenCalledWith('Failed to parse response for sanitization', {
        operation: 'response-sanitization',
      });

      // Restore original parse
      JSON.parse = originalParse;
    });

    it('should handle primitive values in sanitizeObject', async () => {
      const primitiveHandler = vi.fn().mockResolvedValue({
        string: 'test',
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
      });
      const wrappedHandler = withHandlerWrapper(context, mockValidator, primitiveHandler);

      const result = await wrappedHandler({});

      expect(result.content[0].text).toContain('"string": "test"');
      expect(result.content[0].text).toContain('"number": 42');
      expect(result.content[0].text).toContain('"boolean": true');
      expect(result.content[0].text).toContain('"null": null');
    });

    it('should handle arrays with sensitive data', async () => {
      const arrayHandler = vi.fn().mockResolvedValue([
        { name: 'Item 1', password: 'secret1' },
        { name: 'Item 2', apiKey: 'key123' },
        'simple string',
        { nested: { authorization: 'Bearer token' } },
      ]);
      const wrappedHandler = withHandlerWrapper(context, mockValidator, arrayHandler);

      const result = await wrappedHandler({});

      expect(result.content[0].text).toContain('"password": "[REDACTED]"');
      expect(result.content[0].text).toContain('"apiKey": "[REDACTED]"');
      expect(result.content[0].text).toContain('"authorization": "[REDACTED]"');
      expect(result.content[0].text).toContain('"name": "Item 1"');
      expect(result.content[0].text).toContain('"simple string"');
    });
  });

  describe('error edge cases', () => {
    it('should handle errors without constructor', async () => {
      const weirdError = Object.create(null);
      weirdError.message = 'Weird error';
      
      const errorHandler = vi.fn().mockRejectedValue(weirdError);
      const wrappedHandler = withHandlerWrapper(context, mockValidator, errorHandler);

      const result = await wrappedHandler({});

      expect(Logger.logError).toHaveBeenCalledWith('test-operation', weirdError, {
        tool: 'test-tool',
        userId: 'user123',
        requestId: 'req456',
        duration: expect.any(Number),
        errorType: undefined,
      });
    });

    it('should handle API errors without status', async () => {
      const apiErrorWithoutStatus = {
        response: {}, // No status property
        message: 'Network Error',
      };
      
      const errorHandler = vi.fn().mockRejectedValue(apiErrorWithoutStatus);
      const wrappedHandler = withHandlerWrapper(context, mockValidator, errorHandler);

      const result = await wrappedHandler({});

      // This object has response but no status, and isn't an Error instance, so should use fallback
      expect(result).toEqual({
        content: [{ type: 'text', text: 'An unknown error occurred' }],
        isError: true,
      });
    });
  });
});