import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurityUtils } from '../../utils/security.js';

describe('SecurityUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sanitizeInput', () => {
    it('should return null and undefined as-is', () => {
      expect(SecurityUtils.sanitizeInput(null)).toBeNull();
      expect(SecurityUtils.sanitizeInput(undefined)).toBeUndefined();
    });

    it('should sanitize string input', () => {
      const input = '<script>alert("xss")</script>';
      expect(() => SecurityUtils.sanitizeInput(input)).toThrow('Potentially dangerous content detected in input');
    });

    it('should sanitize safe string input', () => {
      const input = 'Hello World & Company';
      const result = SecurityUtils.sanitizeInput(input);
      expect(result).toBe('Hello World &amp; Company');
    });

    it('should sanitize array input', () => {
      const input = ['safe', '<script>bad</script>'];
      expect(() => SecurityUtils.sanitizeInput(input)).toThrow('Potentially dangerous content detected in input');
    });

    it('should sanitize safe array input', () => {
      const input = ['item1', 'item2'];
      const result = SecurityUtils.sanitizeInput(input);
      expect(result).toEqual(['item1', 'item2']);
    });

    it('should sanitize object input', () => {
      const input = { name: 'test', value: 'safe' };
      const result = SecurityUtils.sanitizeInput(input);
      expect(result).toEqual({ name: 'test', value: 'safe' });
    });

    it('should return primitive values as-is', () => {
      expect(SecurityUtils.sanitizeInput(123)).toBe(123);
      expect(SecurityUtils.sanitizeInput(true)).toBe(true);
    });

    it('should throw error for oversized string', () => {
      const largeString = 'a'.repeat(10001);
      expect(() => SecurityUtils.sanitizeInput(largeString)).toThrow('String length exceeds maximum allowed length');
    });

    it('should throw error for oversized array', () => {
      const largeArray = new Array(1001).fill('item');
      expect(() => SecurityUtils.sanitizeInput(largeArray)).toThrow('Array size exceeds maximum allowed size');
    });

    it('should skip prototype pollution keys', () => {
      const input = { __proto__: { evil: true }, name: 'test' };
      const result = SecurityUtils.sanitizeInput(input);
      expect(result).toEqual({ name: 'test' });
      expect(result).not.toHaveProperty('__proto__');
    });
  });

  describe('string sanitization', () => {
    it('should encode HTML entities', () => {
      const input = '<div class="test">content</div>';
      const result = SecurityUtils.sanitizeInput(input);
      expect(result).toBe('&lt;div class=&quot;test&quot;&gt;content&lt;&#x2F;div&gt;');
    });

    it('should encode single quotes', () => {
      const input = "it's a test";
      const result = SecurityUtils.sanitizeInput(input);
      expect(result).toBe('it&#x27;s a test');
    });

    it('should detect javascript protocol', () => {
      const input = 'javascript:alert(1)';
      expect(() => SecurityUtils.sanitizeInput(input)).toThrow('Potentially dangerous content detected in input');
    });

    it('should detect data protocol', () => {
      const input = 'data:text/html,<script>alert(1)</script>';
      expect(() => SecurityUtils.sanitizeInput(input)).toThrow('Potentially dangerous content detected in input');
    });

    it('should detect vbscript protocol', () => {
      const input = 'vbscript:msgbox(1)';
      expect(() => SecurityUtils.sanitizeInput(input)).toThrow('Potentially dangerous content detected in input');
    });

    it('should detect event handlers', () => {
      const input = 'onclick=alert(1)';
      expect(() => SecurityUtils.sanitizeInput(input)).toThrow('Potentially dangerous content detected in input');
    });
  });

  describe('array sanitization', () => {
    it('should recursively sanitize array elements', () => {
      const input = ['safe', { name: 'test' }, 123];
      const result = SecurityUtils.sanitizeInput(input);
      expect(result).toEqual(['safe', { name: 'test' }, 123]);
    });
  });

  describe('object sanitization', () => {
    it('should filter out prototype pollution keys', () => {
      const input = {
        username: 'user',
        constructor: { evil: true },
        prototype: { bad: true },
        normal: 'value'
      };
      const result = SecurityUtils.sanitizeInput(input);
      expect(result).toEqual({
        username: 'user',
        normal: 'value'
      });
    });

    it('should recursively sanitize object values', () => {
      const input = {
        user: { name: 'test & user' },
        data: ['item1', 'item2']
      };
      const result = SecurityUtils.sanitizeInput(input);
      expect(result).toEqual({
        user: { name: 'test &amp; user' },
        data: ['item1', 'item2']
      });
    });
  });

  describe('validateUrl', () => {
    it('should allow valid HTTPS URLs', () => {
      const result = SecurityUtils.validateUrl('https://example.com/api');
      expect(result).toBe(true);
    });

    it('should allow valid HTTP URLs', () => {
      const result = SecurityUtils.validateUrl('http://example.com/api');
      expect(result).toBe(true);
    });

    it('should block localhost URLs', () => {
      const result = SecurityUtils.validateUrl('http://localhost:3000/api');
      expect(result).toBe(false);
    });

    it('should block 127.0.0.1 URLs', () => {
      const result = SecurityUtils.validateUrl('http://127.0.0.1:3000/api');
      expect(result).toBe(false);
    });

    it('should block private IP ranges', () => {
      expect(SecurityUtils.validateUrl('http://192.168.1.1/api')).toBe(false);
      expect(SecurityUtils.validateUrl('http://10.0.0.1/api')).toBe(false);
      expect(SecurityUtils.validateUrl('http://172.16.0.1/api')).toBe(false);
    });

    it('should block non-HTTP protocols', () => {
      expect(SecurityUtils.validateUrl('ftp://example.com')).toBe(false);
      expect(SecurityUtils.validateUrl('file:///etc/passwd')).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      const result = SecurityUtils.validateUrl('not-a-url');
      expect(result).toBe(false);
    });

    it('should check allowed domains when provided', () => {
      const result = SecurityUtils.validateUrl('https://example.com/api', ['example.com']);
      expect(result).toBe(true);
    });

    it('should reject URLs not in allowed domains', () => {
      const result = SecurityUtils.validateUrl('https://evil.com/api', ['example.com']);
      expect(result).toBe(false);
    });
  });
});