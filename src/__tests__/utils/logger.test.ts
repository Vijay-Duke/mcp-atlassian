import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import winston from 'winston';
import { Logger, LogLevel, type LogContext } from '../../utils/logger.js';

// Mock winston
vi.mock('winston', () => {
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    add: vi.fn(),
  };

  const mockWinston = {
    createLogger: vi.fn(() => mockLogger),
    format: {
      combine: vi.fn((...args) => args),
      timestamp: vi.fn(() => 'timestamp'),
      errors: vi.fn(() => 'errors'),
      json: vi.fn(() => 'json'),
      prettyPrint: vi.fn(() => 'prettyPrint'),
      colorize: vi.fn(() => 'colorize'),
      simple: vi.fn(() => 'simple'),
    },
    transports: {
      Console: vi.fn().mockImplementation((config) => ({ type: 'console', config })),
      File: vi.fn().mockImplementation((config) => ({ type: 'file', config })),
    },
  };

  return { default: mockWinston, ...mockWinston };
});

describe('Logger', () => {
  let mockWinstonLogger: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Get the mock logger instance
    mockWinstonLogger = (winston as any).createLogger();
    
    // Reset environment variables
    delete process.env.LOG_LEVEL;
    delete process.env.NODE_ENV;
    delete process.env.MCP_SERVER_MODE;
    delete process.env.npm_package_version;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('LogLevel enum', () => {
    it('should define correct log levels', () => {
      expect(LogLevel.ERROR).toBe('error');
      expect(LogLevel.WARN).toBe('warn');
      expect(LogLevel.INFO).toBe('info');
      expect(LogLevel.DEBUG).toBe('debug');
    });
  });

  describe('sanitizeContext', () => {
    it('should remove sensitive data from metadata', () => {
      const context: LogContext = {
        userId: 'user123',
        metadata: {
          password: 'secret123',
          token: 'token456',
          apiKey: 'key789',
          secret: 'secret321',
          safeData: 'safe123',
          publicInfo: 'public456',
        },
      };

      Logger.info('test message', context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'test message',
        expect.objectContaining({
          userId: 'user123',
          metadata: {
            safeData: 'safe123',
            publicInfo: 'public456',
          },
        })
      );
    });

    it('should handle context without metadata', () => {
      const context: LogContext = {
        userId: 'user123',
        requestId: 'req456',
      };

      Logger.info('test message', context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'test message',
        expect.objectContaining({
          userId: 'user123',
          requestId: 'req456',
        })
      );
    });

    it('should handle empty context', () => {
      Logger.info('test message');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('test message', {});
    });

    it('should preserve non-sensitive metadata', () => {
      const context: LogContext = {
        metadata: {
          operation: 'test-op',
          duration: 1000,
          result: 'success',
        },
      };

      Logger.info('test message', context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'test message',
        expect.objectContaining({
          metadata: {
            operation: 'test-op',
            duration: 1000,
            result: 'success',
          },
        })
      );
    });
  });

  describe('basic logging methods', () => {
    it('should log info messages', () => {
      const context: LogContext = { userId: 'user123' };
      Logger.info('Info message', context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('Info message', context);
    });

    it('should log warning messages', () => {
      const context: LogContext = { operation: 'test-op' };
      Logger.warn('Warning message', context);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith('Warning message', context);
    });

    it('should log error messages', () => {
      const context: LogContext = { requestId: 'req123' };
      Logger.error('Error message', context);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith('Error message', context);
    });

    it('should log debug messages', () => {
      const context: LogContext = { tool: 'test-tool' };
      Logger.debug('Debug message', context);

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith('Debug message', context);
    });

    it('should handle undefined context', () => {
      Logger.info('Message without context');
      Logger.warn('Warning without context');
      Logger.error('Error without context');
      Logger.debug('Debug without context');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('Message without context', {});
      expect(mockWinstonLogger.warn).toHaveBeenCalledWith('Warning without context', {});
      expect(mockWinstonLogger.error).toHaveBeenCalledWith('Error without context', {});
      expect(mockWinstonLogger.debug).toHaveBeenCalledWith('Debug without context', {});
    });
  });

  describe('logRequest', () => {
    it('should log request start with operation and timestamp', () => {
      const context: LogContext = { userId: 'user123', tool: 'test-tool' };
      
      // Mock Date.prototype.toISOString
      const mockDate = '2023-01-01T00:00:00.000Z';
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      Logger.logRequest('test-operation', context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Starting test-operation',
        expect.objectContaining({
          userId: 'user123',
          tool: 'test-tool',
          operation: 'test-operation',
          timestamp: mockDate,
        })
      );
    });

    it('should log request with empty context', () => {
      const mockDate = '2023-01-01T00:00:00.000Z';
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      Logger.logRequest('simple-operation');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Starting simple-operation',
        expect.objectContaining({
          operation: 'simple-operation',
          timestamp: mockDate,
        })
      );
    });
  });

  describe('logResponse', () => {
    it('should log response completion with duration', () => {
      const context: LogContext = { userId: 'user123', requestId: 'req456' };
      const mockDate = '2023-01-01T00:00:00.000Z';
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      Logger.logResponse('test-operation', 1500, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Completed test-operation',
        expect.objectContaining({
          userId: 'user123',
          requestId: 'req456',
          operation: 'test-operation',
          duration: 1500,
          timestamp: mockDate,
        })
      );
    });

    it('should log response with minimal context', () => {
      const mockDate = '2023-01-01T00:00:00.000Z';
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      Logger.logResponse('simple-operation', 500);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Completed simple-operation',
        expect.objectContaining({
          operation: 'simple-operation',
          duration: 500,
          timestamp: mockDate,
        })
      );
    });
  });

  describe('logError', () => {
    it('should log error with stack trace', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';
      const context: LogContext = { userId: 'user123', operation: 'failed-op' };
      const mockDate = '2023-01-01T00:00:00.000Z';
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      Logger.logError('test-operation', error, context);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        'Failed test-operation',
        expect.objectContaining({
          userId: 'user123',
          operation: 'test-operation',
          error: error,
          errorMessage: 'Test error',
          errorStack: 'Error: Test error\n    at test.js:1:1',
          timestamp: mockDate,
        })
      );
    });

    it('should log error with minimal context', () => {
      const error = new Error('Simple error');
      const mockDate = '2023-01-01T00:00:00.000Z';
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      Logger.logError('simple-operation', error);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        'Failed simple-operation',
        expect.objectContaining({
          operation: 'simple-operation',
          error: error,
          errorMessage: 'Simple error',
          errorStack: error.stack,
          timestamp: mockDate,
        })
      );
    });
  });

  describe('logToolCall', () => {
    it('should log tool call with user and metadata', () => {
      const metadata = { args: { param: 'value' }, requestId: 'req123' };
      const mockDate = '2023-01-01T00:00:00.000Z';
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      Logger.logToolCall('test-tool', 'user123', metadata);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Tool called: test-tool',
        expect.objectContaining({
          tool: 'test-tool',
          userId: 'user123',
          metadata: metadata,
          timestamp: mockDate,
        })
      );
    });

    it('should log tool call without user or metadata', () => {
      const mockDate = '2023-01-01T00:00:00.000Z';
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      Logger.logToolCall('simple-tool');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Tool called: simple-tool',
        expect.objectContaining({
          tool: 'simple-tool',
          userId: undefined,
          metadata: undefined,
          timestamp: mockDate,
        })
      );
    });
  });

  describe('logPerformance', () => {
    it('should log performance as info for fast operations', () => {
      const context: LogContext = { tool: 'fast-tool' };

      Logger.logPerformance('fast-operation', 1000, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Performance: fast-operation took 1000ms',
        expect.objectContaining({
          tool: 'fast-tool',
          operation: 'fast-operation',
          duration: 1000,
        })
      );
      expect(mockWinstonLogger.warn).not.toHaveBeenCalled();
    });

    it('should log performance as warning for slow operations', () => {
      const context: LogContext = { tool: 'slow-tool' };

      Logger.logPerformance('slow-operation', 6000, context);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        'Performance: slow-operation took 6000ms',
        expect.objectContaining({
          tool: 'slow-tool',
          operation: 'slow-operation',
          duration: 6000,
          performanceIssue: true,
        })
      );
      expect(mockWinstonLogger.info).not.toHaveBeenCalled();
    });

    it('should log performance with threshold exactly at 5000ms as warning', () => {
      const context: LogContext = { operation: 'threshold-test' };

      Logger.logPerformance('boundary-operation', 5001, context);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        'Performance: boundary-operation took 5001ms',
        expect.objectContaining({
          operation: 'boundary-operation',
          duration: 5001,
          performanceIssue: true,
        })
      );
    });

    it('should log performance just under threshold as info', () => {
      Logger.logPerformance('quick-operation', 4999);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Performance: quick-operation took 4999ms',
        expect.objectContaining({
          operation: 'quick-operation',
          duration: 4999,
        })
      );
    });

    it('should handle empty context in performance logging', () => {
      Logger.logPerformance('no-context-operation', 2000);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Performance: no-context-operation took 2000ms',
        expect.objectContaining({
          operation: 'no-context-operation',
          duration: 2000,
        })
      );
    });
  });

  describe('logSecurity', () => {
    it('should log security events with timestamp', () => {
      const context: LogContext = { userId: 'user123', operation: 'suspicious-activity' };
      const mockDate = '2023-01-01T00:00:00.000Z';
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      Logger.logSecurity('Unauthorized access attempt', context);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        'Security event: Unauthorized access attempt',
        expect.objectContaining({
          userId: 'user123',
          operation: 'suspicious-activity',
          securityEvent: true,
          timestamp: mockDate,
        })
      );
    });

    it('should log security events with minimal context', () => {
      const mockDate = '2023-01-01T00:00:00.000Z';
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      Logger.logSecurity('SQL injection attempt');

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        'Security event: SQL injection attempt',
        expect.objectContaining({
          securityEvent: true,
          timestamp: mockDate,
        })
      );
    });
  });

  describe('context sanitization edge cases', () => {
    it('should handle null metadata gracefully', () => {
      const context: LogContext = {
        userId: 'user123',
        metadata: null as any,
      };

      Logger.info('test with null metadata', context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'test with null metadata',
        expect.objectContaining({
          userId: 'user123',
          metadata: null,
        })
      );
    });

    it('should handle metadata with only sensitive keys', () => {
      const context: LogContext = {
        metadata: {
          password: 'secret',
          token: 'token',
          apiKey: 'key',
          secret: 'secret',
        },
      };

      Logger.info('sensitive only', context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'sensitive only',
        expect.objectContaining({
          metadata: {},
        })
      );
    });

    it('should handle nested objects in metadata (shallow sanitization)', () => {
      const context: LogContext = {
        metadata: {
          config: {
            password: 'nested-secret',
            url: 'https://api.example.com',
          },
          stats: {
            count: 42,
            token: 'another-secret',
          },
          // Top-level sensitive keys will be removed
          password: 'top-level-secret',
          nonSensitive: 'safe-data',
        },
      };

      Logger.info('nested objects', context);

      // Only top-level sensitive keys are removed, nested ones remain
      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'nested objects',
        expect.objectContaining({
          metadata: {
            config: {
              password: 'nested-secret',
              url: 'https://api.example.com',
            },
            stats: {
              count: 42,
              token: 'another-secret',
            },
            nonSensitive: 'safe-data',
            // password should be removed
          },
        })
      );

      // Verify top-level password was sanitized
      const loggedContext = mockWinstonLogger.info.mock.calls[0][1];
      expect(loggedContext.metadata).not.toHaveProperty('password');
      expect(loggedContext.metadata.config).toHaveProperty('password'); // nested remains
    });

    it('should preserve undefined values in metadata', () => {
      const context: LogContext = {
        metadata: {
          definedValue: 'test',
          undefinedValue: undefined,
          nullValue: null,
        },
      };

      Logger.info('undefined handling', context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'undefined handling',
        expect.objectContaining({
          metadata: {
            definedValue: 'test',
            undefinedValue: undefined,
            nullValue: null,
          },
        })
      );
    });
  });

  describe('complex integration scenarios', () => {
    it('should handle complete request lifecycle logging', () => {
      const requestContext: LogContext = {
        userId: 'user123',
        requestId: 'req456',
        tool: 'confluence-tool',
      };

      const mockDate = '2023-01-01T00:00:00.000Z';
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      // Log request start
      Logger.logRequest('get-confluence-page', requestContext);

      // Log tool call
      Logger.logToolCall('get-page', 'user123', { pageId: '12345' });

      // Log performance
      Logger.logPerformance('get-confluence-page', 1500, requestContext);

      // Log response
      Logger.logResponse('get-confluence-page', 1500, requestContext);

      expect(mockWinstonLogger.info).toHaveBeenCalledTimes(4);
      expect(mockWinstonLogger.info).toHaveBeenNthCalledWith(1, 'Starting get-confluence-page', expect.any(Object));
      expect(mockWinstonLogger.info).toHaveBeenNthCalledWith(2, 'Tool called: get-page', expect.any(Object));
      expect(mockWinstonLogger.info).toHaveBeenNthCalledWith(3, 'Performance: get-confluence-page took 1500ms', expect.any(Object));
      expect(mockWinstonLogger.info).toHaveBeenNthCalledWith(4, 'Completed get-confluence-page', expect.any(Object));
    });

    it('should handle error scenario with context propagation', () => {
      const errorContext: LogContext = {
        userId: 'user123',
        requestId: 'req456',
        tool: 'failing-tool',
        metadata: {
          attempt: 1,
          password: 'should-be-removed',
          configuration: 'safe-config',
        },
      };

      const error = new Error('Network timeout');
      const mockDate = '2023-01-01T00:00:00.000Z';
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      Logger.logError('network-operation', error, errorContext);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        'Failed network-operation',
        expect.objectContaining({
          userId: 'user123',
          requestId: 'req456',
          tool: 'failing-tool',
          operation: 'network-operation',
          error: error,
          errorMessage: 'Network timeout',
          metadata: {
            attempt: 1,
            configuration: 'safe-config',
            // password should be removed
          },
          timestamp: mockDate,
        })
      );

      // Verify password was sanitized
      const loggedContext = mockWinstonLogger.error.mock.calls[0][1];
      expect(loggedContext.metadata).not.toHaveProperty('password');
    });
  });
});