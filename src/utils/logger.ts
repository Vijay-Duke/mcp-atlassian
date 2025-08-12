import winston from 'winston';

// Define log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

// Define log context interface
export interface LogContext {
  userId?: string;
  requestId?: string;
  operation?: string;
  tool?: string;
  duration?: number;
  error?: Error;
  metadata?: Record<string, any>;
  // Allow any additional properties for flexible logging
  [key: string]: any;
}

// Create winston logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
  ),
  defaultMeta: {
    service: 'mcp-atlassian',
    version: process.env.npm_package_version || '2.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Only use console transport if explicitly running in development mode
    // MCP servers must not write to stdout/stderr as it interferes with JSON-RPC protocol
    // Default to MCP_SERVER_MODE=true to prevent console output
    ...(process.env.MCP_SERVER_MODE === 'false' ? [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize({ all: true }),
          winston.format.simple()
        ),
      })
    ] : []),
  ],
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    })
  );

  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    })
  );
}

// Utility functions for structured logging
export class Logger {
  private static sanitizeContext(context: LogContext): LogContext {
    const sanitized = { ...context };

    // Remove sensitive data
    if (sanitized.metadata) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, token, apiKey, secret, ...safeMeta } = sanitized.metadata;
      sanitized.metadata = safeMeta;
    }

    return sanitized;
  }

  static info(message: string, context?: LogContext): void {
    logger.info(message, this.sanitizeContext(context || {}));
  }

  static warn(message: string, context?: LogContext): void {
    logger.warn(message, this.sanitizeContext(context || {}));
  }

  static error(message: string, context?: LogContext): void {
    logger.error(message, this.sanitizeContext(context || {}));
  }

  static debug(message: string, context?: LogContext): void {
    logger.debug(message, this.sanitizeContext(context || {}));
  }

  static logRequest(operation: string, context: LogContext = {}): void {
    this.info(`Starting ${operation}`, {
      ...context,
      operation,
      timestamp: new Date().toISOString(),
    });
  }

  static logResponse(operation: string, duration: number, context: LogContext = {}): void {
    this.info(`Completed ${operation}`, {
      ...context,
      operation,
      duration,
      timestamp: new Date().toISOString(),
    });
  }

  static logError(operation: string, error: Error, context: LogContext = {}): void {
    this.error(`Failed ${operation}`, {
      ...context,
      operation,
      error,
      errorMessage: error.message,
      errorStack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }

  static logToolCall(toolName: string, userId?: string, metadata?: Record<string, any>): void {
    this.info(`Tool called: ${toolName}`, {
      tool: toolName,
      userId,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  static logPerformance(operation: string, duration: number, context: LogContext = {}): void {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.INFO;
    const message = `Performance: ${operation} took ${duration}ms`;

    if (level === LogLevel.WARN) {
      this.warn(message, { ...context, operation, duration, performanceIssue: true });
    } else {
      this.info(message, { ...context, operation, duration });
    }
  }

  static logSecurity(event: string, context: LogContext = {}): void {
    this.warn(`Security event: ${event}`, {
      ...context,
      securityEvent: true,
      timestamp: new Date().toISOString(),
    });
  }
}

// Export the winston logger instance for direct use if needed
export default logger;
