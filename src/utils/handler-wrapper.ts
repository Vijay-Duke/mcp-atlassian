import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Logger } from './logger.js';
import { formatApiError } from './http-client.js';
import { createValidationError } from './error-handler.js';

export interface HandlerContext {
  operation: string;
  tool: string;
  userId?: string;
  requestId?: string;
}

export interface HandlerOptions {
  returnStructuredData?: boolean; // If true, return object instead of JSON string
  logPerformance?: boolean;
  sanitizeResponse?: boolean;
}

export type HandlerFunction<TArgs, TResult = any> = (args: TArgs) => Promise<TResult>;
export type ValidatorFunction<TArgs> = (args: any) => {
  isValid: boolean;
  validatedArgs?: TArgs;
  errors?: string[];
};

/**
 * Higher-order function that wraps handler methods with common functionality:
 * - Error handling and logging
 * - Performance monitoring
 * - Response formatting
 * - Input validation
 */
export function withHandlerWrapper<TArgs, TResult = any>(
  context: HandlerContext,
  validator: ValidatorFunction<TArgs>,
  handler: HandlerFunction<TArgs, TResult>,
  options: HandlerOptions = {}
) {
  return async (args: any): Promise<CallToolResult> => {
    const startTime = Date.now();
    const { operation, tool, userId, requestId } = context;
    const {
      returnStructuredData = false,
      logPerformance = true,
      sanitizeResponse = true,
    } = options;

    try {
      // Log the start of the operation
      Logger.logRequest(operation, { tool, userId, requestId });

      // Validate input arguments
      const validation = validator(args);
      if (!validation.isValid) {
        Logger.logError(
          `${operation}-validation`,
          new Error(`Validation failed: ${validation.errors?.join(', ')}`),
          { tool, userId, requestId, validationErrors: validation.errors }
        );
        return createValidationError(validation.errors || [], operation, 'confluence');
      }

      // Execute the actual handler
      const result = await handler(validation.validatedArgs as TArgs);
      const duration = Date.now() - startTime;

      // Log the completion
      Logger.logResponse(operation, duration, { tool, userId, requestId });

      if (logPerformance) {
        Logger.logPerformance(operation, duration, { tool, userId, requestId });
      }

      // Format the response
      if (returnStructuredData) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } else {
        // If result is already a string or formatted response
        if (typeof result === 'string') {
          return {
            content: [{ type: 'text', text: result }],
          };
        } else if (result && typeof result === 'object' && 'content' in result) {
          // Result is already a CallToolResult
          return result as CallToolResult;
        } else {
          // Convert to JSON string
          const responseText = sanitizeResponse
            ? sanitizeResponseData(JSON.stringify(result, null, 2))
            : JSON.stringify(result, null, 2);

          return {
            content: [{ type: 'text', text: responseText }],
          };
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      Logger.logError(operation, error as Error, {
        tool,
        userId,
        requestId,
        duration,
        errorType: error?.constructor?.name,
      });

      // Format API errors appropriately
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        (error as any).response?.status
      ) {
        return {
          content: [{ type: 'text', text: formatApiError(error) }],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: error instanceof Error ? error.message : 'An unknown error occurred',
          },
        ],
        isError: true,
      };
    }
  };
}

/**
 * Creates a simplified wrapper for handlers that don't need complex validation
 */
export function withSimpleWrapper<TArgs>(
  operation: string,
  tool: string,
  handler: HandlerFunction<TArgs>,
  options: HandlerOptions = {}
) {
  return withHandlerWrapper(
    { operation, tool },
    (args: any) => ({ isValid: true, validatedArgs: args as TArgs }),
    handler,
    options
  );
}

/**
 * Sanitize response data to remove sensitive information
 */
function sanitizeResponseData(jsonString: string): string {
  try {
    const data = JSON.parse(jsonString);
    const sanitized = sanitizeObject(data);
    return JSON.stringify(sanitized, null, 2);
  } catch {
    // If parsing fails, return original string but log warning
    Logger.warn('Failed to parse response for sanitization', {
      operation: 'response-sanitization',
    });
    return jsonString;
  }
}

function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const sanitized = { ...obj };
  const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authorization', 'credentials'];

  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  }

  // Recursively sanitize nested objects
  for (const [key, value] of Object.entries(sanitized)) {
    if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    }
  }

  return sanitized;
}

/**
 * Utility to create a performance monitoring decorator
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  operation: string,
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = Date.now();
    try {
      const result = await handler(...args);
      const duration = Date.now() - startTime;
      Logger.logPerformance(operation, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      Logger.logError(operation, error as Error, { duration });
      throw error;
    }
  }) as T;
}
