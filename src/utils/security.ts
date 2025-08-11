import { Logger } from './logger.js';

export class SecurityUtils {
  private static readonly MAX_STRING_LENGTH = 10000;
  private static readonly MAX_ARRAY_SIZE = 1000;
  private static readonly SENSITIVE_KEYS = [
    'password',
    'token',
    'apiKey',
    'secret',
    'authorization',
    'credentials',
    'auth',
    'key',
    'pass',
    'pwd',
  ];

  /**
   * Sanitize input to prevent injection attacks
   */
  static sanitizeInput(input: any): any {
    if (input === null || input === undefined) {
      return input;
    }

    if (typeof input === 'string') {
      return this.sanitizeString(input);
    }

    if (Array.isArray(input)) {
      return this.sanitizeArray(input);
    }

    if (typeof input === 'object') {
      return this.sanitizeObject(input);
    }

    return input;
  }

  /**
   * Sanitize string input
   */
  private static sanitizeString(str: string): string {
    if (str.length > this.MAX_STRING_LENGTH) {
      Logger.logSecurity('String length exceeded maximum allowed', {
        actualLength: str.length,
        maxLength: this.MAX_STRING_LENGTH,
      });
      throw new Error(`String length exceeds maximum allowed length of ${this.MAX_STRING_LENGTH}`);
    }

    // Remove potentially dangerous HTML/script content
    const dangerous = /<script|javascript:|data:|vbscript:|on\w+=/i;
    if (dangerous.test(str)) {
      Logger.logSecurity('Potentially dangerous content detected in string', {
        content: str.substring(0, 100) + (str.length > 100 ? '...' : ''),
      });
      throw new Error('Potentially dangerous content detected in input');
    }

    // Basic XSS prevention - encode HTML entities
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Sanitize array input
   */
  private static sanitizeArray(arr: any[]): any[] {
    if (arr.length > this.MAX_ARRAY_SIZE) {
      Logger.logSecurity('Array size exceeded maximum allowed', {
        actualSize: arr.length,
        maxSize: this.MAX_ARRAY_SIZE,
      });
      throw new Error(`Array size exceeds maximum allowed size of ${this.MAX_ARRAY_SIZE}`);
    }

    return arr.map((item) => this.sanitizeInput(item));
  }

  /**
   * Sanitize object input
   */
  private static sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Check for potentially dangerous keys
      if (this.isDangerousKey(key)) {
        Logger.logSecurity('Potentially dangerous key detected', { key });
        continue; // Skip dangerous keys
      }

      sanitized[key] = this.sanitizeInput(value);
    }

    return sanitized;
  }

  /**
   * Check if a key is potentially dangerous
   */
  private static isDangerousKey(key: string): boolean {
    const dangerous = /^(__proto__|constructor|prototype)$/i;
    return dangerous.test(key);
  }

  /**
   * Redact sensitive information from logs
   */
  static redactSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.redactSensitiveData(item));
    }

    const redacted = { ...data };

    for (const key of Object.keys(redacted)) {
      if (this.isSensitiveKey(key)) {
        redacted[key] = '[REDACTED]';
      } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
        redacted[key] = this.redactSensitiveData(redacted[key]);
      }
    }

    return redacted;
  }

  /**
   * Check if a key contains sensitive information
   */
  private static isSensitiveKey(key: string): boolean {
    const lowerKey = key.toLowerCase();
    return this.SENSITIVE_KEYS.some((sensitiveKey) =>
      lowerKey.includes(sensitiveKey.toLowerCase())
    );
  }

  /**
   * Validate URL to prevent SSRF attacks
   */
  static validateUrl(url: string, allowedDomains?: string[]): boolean {
    try {
      const parsedUrl = new URL(url);

      // Block internal/local URLs
      const hostname = parsedUrl.hostname.toLowerCase();
      const blockedHostnames = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        '::1',
        '10.',
        '172.16.',
        '192.168.',
        '169.254.',
      ];

      if (blockedHostnames.some((blocked) => hostname.includes(blocked))) {
        Logger.logSecurity('Blocked internal URL access attempt', { url: hostname });
        return false;
      }

      // Check protocol
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        Logger.logSecurity('Blocked non-HTTP protocol', { protocol: parsedUrl.protocol });
        return false;
      }

      // Check allowed domains if specified
      if (allowedDomains && allowedDomains.length > 0) {
        const isAllowed = allowedDomains.some(
          (domain) => hostname === domain || hostname.endsWith('.' + domain)
        );

        if (!isAllowed) {
          Logger.logSecurity('URL not in allowed domains', {
            hostname,
            allowedDomains,
          });
          return false;
        }
      }

      return true;
    } catch (error) {
      Logger.logSecurity('Invalid URL format', {
        url,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      return false;
    }
  }

  /**
   * Rate limiting check (simple in-memory implementation)
   */
  private static rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  static checkRateLimit(identifier: string, maxRequests = 100, windowMs = 60000): boolean {
    const now = Date.now();
    const record = this.rateLimitMap.get(identifier);

    if (!record || now > record.resetTime) {
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (record.count >= maxRequests) {
      Logger.logSecurity('Rate limit exceeded', {
        identifier,
        count: record.count,
        maxRequests,
      });
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * Clean up old rate limit entries
   */
  static cleanupRateLimitMap(): void {
    const now = Date.now();
    for (const [key, value] of this.rateLimitMap.entries()) {
      if (now > value.resetTime) {
        this.rateLimitMap.delete(key);
      }
    }
  }

  /**
   * Validate file upload security
   */
  static validateFileUpload(
    filename: string,
    fileSize: number,
    maxSize = 10 * 1024 * 1024
  ): { valid: boolean; error?: string } {
    // Check file size
    if (fileSize > maxSize) {
      return {
        valid: false,
        error: `File size ${fileSize} exceeds maximum allowed size ${maxSize}`,
      };
    }

    // Check for dangerous file extensions
    const dangerousExtensions = [
      '.exe',
      '.scr',
      '.bat',
      '.cmd',
      '.com',
      '.pif',
      '.vbs',
      '.js',
      '.jar',
      '.php',
      '.asp',
      '.jsp',
      '.sh',
      '.ps1',
      '.py',
      '.rb',
      '.pl',
    ];

    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    if (dangerousExtensions.includes(extension)) {
      Logger.logSecurity('Dangerous file extension blocked', { filename, extension });
      return {
        valid: false,
        error: `File extension ${extension} is not allowed`,
      };
    }

    // Check for path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      Logger.logSecurity('Path traversal attempt blocked', { filename });
      return {
        valid: false,
        error: 'Invalid characters in filename',
      };
    }

    return { valid: true };
  }
}
