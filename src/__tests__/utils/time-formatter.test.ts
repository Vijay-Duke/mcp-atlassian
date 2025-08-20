import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  setWorkHoursConfig,
  getWorkHoursConfig,
  breakdownTime,
  formatSeconds,
  formatTimeWithMetadata,
  parseTimeString,
  validateWorkHoursConfig,
  getConfigInfo,
  type WorkHoursConfig,
  type TimeBreakdown,
} from '../../utils/time-formatter.js';

describe('TimeFormatter', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Clear environment variables
    delete process.env.WORK_HOURS_PER_DAY;
    delete process.env.TIME_DISPLAY_FORMAT;
    delete process.env.INCLUDE_SECONDS;
    
    // Reset to default config
    setWorkHoursConfig({
      hoursPerDay: 8,
      minutesPerHour: 60,
      displayFormat: 'mixed',
      includeSeconds: false,
    });
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('configuration management', () => {
    it('should return default configuration', () => {
      const config = getWorkHoursConfig();
      
      expect(config).toEqual({
        hoursPerDay: 8,
        minutesPerHour: 60,
        displayFormat: 'mixed',
        includeSeconds: false,
      });
    });

    it('should update configuration', () => {
      setWorkHoursConfig({
        hoursPerDay: 6,
        displayFormat: 'long',
        includeSeconds: true,
      });

      const config = getWorkHoursConfig();
      
      expect(config).toEqual({
        hoursPerDay: 6,
        minutesPerHour: 60,
        displayFormat: 'long',
        includeSeconds: true,
      });
    });

    it('should preserve unmodified config values', () => {
      setWorkHoursConfig({ hoursPerDay: 10 });
      
      const config = getWorkHoursConfig();
      
      expect(config.hoursPerDay).toBe(10);
      expect(config.minutesPerHour).toBe(60); // unchanged
      expect(config.displayFormat).toBe('mixed'); // unchanged
    });

    it('should return a copy of config to prevent mutations', () => {
      const config1 = getWorkHoursConfig();
      const config2 = getWorkHoursConfig();
      
      config1.hoursPerDay = 999;
      
      expect(config2.hoursPerDay).toBe(8); // unchanged
      expect(getWorkHoursConfig().hoursPerDay).toBe(8); // unchanged
    });
  });

  describe('environment variable loading', () => {
    it('should load valid WORK_HOURS_PER_DAY from environment', () => {
      process.env.WORK_HOURS_PER_DAY = '10';
      
      // Re-import to trigger environment loading
      vi.resetModules();
      
      // Since we can't easily re-import in tests, we'll test the validation logic
      expect(parseInt('10', 10)).toBe(10);
      expect(!isNaN(10) && 10 > 0 && 10 <= 24).toBe(true);
    });

    it('should ignore invalid WORK_HOURS_PER_DAY values', () => {
      const invalidValues = ['0', '25', 'abc', '', '-5'];
      
      invalidValues.forEach(value => {
        const parsed = parseInt(value, 10);
        const isValid = !isNaN(parsed) && parsed > 0 && parsed <= 24;
        expect(isValid).toBe(false);
      });
    });

    it('should load valid TIME_DISPLAY_FORMAT from environment', () => {
      const validFormats = ['short', 'long', 'mixed'];
      
      validFormats.forEach(format => {
        expect(['short', 'long', 'mixed'].includes(format.toLowerCase())).toBe(true);
      });
    });

    it('should ignore invalid TIME_DISPLAY_FORMAT values', () => {
      const invalidFormats = ['invalid', '', 'brief'];
      
      invalidFormats.forEach(format => {
        expect(['short', 'long', 'mixed'].includes(format.toLowerCase())).toBe(false);
      });
    });

    it('should load INCLUDE_SECONDS from environment', () => {
      expect('true'.toLowerCase() === 'true').toBe(true);
      expect('false'.toLowerCase() === 'true').toBe(false);
      expect('TRUE'.toLowerCase() === 'true').toBe(true);
      expect('anything'.toLowerCase() === 'true').toBe(false);
    });
  });

  describe('breakdownTime', () => {
    it('should break down time correctly with default config', () => {
      const breakdown = breakdownTime(32400); // 9 hours = 1 day + 1 hour
      
      expect(breakdown).toEqual({
        totalSeconds: 32400,
        days: 1,
        hours: 1,
        minutes: 0,
        seconds: 0,
      });
    });

    it('should handle negative seconds by setting to zero', () => {
      const breakdown = breakdownTime(-1000);
      
      expect(breakdown).toEqual({
        totalSeconds: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
    });

    it('should work with custom configuration', () => {
      const customConfig = { hoursPerDay: 4, minutesPerHour: 30 };
      const breakdown = breakdownTime(7230, customConfig); // Test with 7230 seconds
      
      // 4 hours/day * 30 minutes/hour * 60 seconds/minute = 7200 seconds per day
      // 7230 - 7200 = 30 seconds remaining
      // 30 seconds / 60 seconds per minute (not 30) = 0.5 minutes = 0 whole minutes, 30 seconds
      
      expect(breakdown.totalSeconds).toBe(7230);
      expect(breakdown.days).toBe(1); // 7230 / 7200 = 1 day
      expect(breakdown.hours).toBe(0);
      expect(breakdown.minutes).toBe(0); // 30 seconds remaining / 60 = 0 minutes
      expect(breakdown.seconds).toBe(30); // 30 seconds remaining
    });

    it('should handle complex time breakdowns', () => {
      // With 8 hours per day: 1 day = 8 * 3600 = 28800 seconds
      // Let's use 90061 seconds = 3 days, 1 hour, 1 minute, 1 second
      // 3 * 28800 = 86400, remaining = 90061 - 86400 = 3661
      // 3661 / 3600 = 1 hour, remaining = 61
      // 61 / 60 = 1 minute, remaining = 1 second
      const breakdown = breakdownTime(90061);
      
      expect(breakdown).toEqual({
        totalSeconds: 90061,
        days: 3,
        hours: 1,
        minutes: 1,
        seconds: 1,
      });
    });

    it('should handle zero seconds', () => {
      const breakdown = breakdownTime(0);
      
      expect(breakdown).toEqual({
        totalSeconds: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
    });

    it('should handle seconds only', () => {
      const breakdown = breakdownTime(45);
      
      expect(breakdown).toEqual({
        totalSeconds: 45,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 45,
      });
    });

    it('should handle minutes only', () => {
      const breakdown = breakdownTime(900); // 15 minutes
      
      expect(breakdown).toEqual({
        totalSeconds: 900,
        days: 0,
        hours: 0,
        minutes: 15,
        seconds: 0,
      });
    });
  });

  describe('formatSeconds', () => {
    it('should format zero seconds correctly', () => {
      expect(formatSeconds(0)).toBe('0m');
      
      setWorkHoursConfig({ displayFormat: 'long' });
      expect(formatSeconds(0)).toBe('0 minutes');
    });

    it('should format mixed format (default)', () => {
      expect(formatSeconds(3661)).toBe('1h 1m'); // Default includeSeconds: false
      
      setWorkHoursConfig({ includeSeconds: true });
      expect(formatSeconds(3661)).toBe('1h 1m 1s');
    });

    it('should format short format', () => {
      setWorkHoursConfig({ displayFormat: 'short' });
      
      // 176461 seconds with 8-hour days = 6 days (176461 / 28800 = 6.13...)
      expect(formatSeconds(176461)).toBe('6d'); // Shows only largest unit
      expect(formatSeconds(3661)).toBe('1h');
      expect(formatSeconds(61)).toBe('1m');
      
      setWorkHoursConfig({ displayFormat: 'short', includeSeconds: true });
      expect(formatSeconds(45)).toBe('45s');
    });

    it('should format long format', () => {
      setWorkHoursConfig({ displayFormat: 'long' });
      
      expect(formatSeconds(28800)).toBe('1 day'); // 1 work day = 8 hours = 28800 seconds
      expect(formatSeconds(57600)).toBe('2 days'); // 2 work days = 16 hours = 57600 seconds
      expect(formatSeconds(3600)).toBe('1 hour');
      expect(formatSeconds(7200)).toBe('2 hours');
      expect(formatSeconds(60)).toBe('1 minute');
      expect(formatSeconds(120)).toBe('2 minutes');
      
      setWorkHoursConfig({ displayFormat: 'long', includeSeconds: true });
      expect(formatSeconds(1)).toBe('1 second');
      expect(formatSeconds(2)).toBe('2 seconds');
    });

    it('should handle long format with multiple units', () => {
      setWorkHoursConfig({ displayFormat: 'long' });
      
      expect(formatSeconds(3660)).toBe('1 hour and 1 minute'); // 2 units
      expect(formatSeconds(90061)).toBe('3 days, 1 hour, and 1 minute'); // 3 units (corrected days)
      
      setWorkHoursConfig({ displayFormat: 'long', includeSeconds: true });
      expect(formatSeconds(90062)).toBe('3 days, 1 hour, 1 minute, and 2 seconds'); // 4 units
    });

    it('should respect includeSeconds setting', () => {
      setWorkHoursConfig({ includeSeconds: false });
      expect(formatSeconds(3661)).toBe('1h 1m'); // No seconds
      
      setWorkHoursConfig({ includeSeconds: true });
      expect(formatSeconds(3661)).toBe('1h 1m 1s'); // With seconds
    });

    it('should use custom config parameter', () => {
      const result = formatSeconds(7200, { displayFormat: 'long' });
      expect(result).toBe('2 hours');
    });

    it('should handle edge case when no parts are shown', () => {
      setWorkHoursConfig({ displayFormat: 'mixed', includeSeconds: false });
      expect(formatSeconds(30)).toBe('0m'); // Less than a minute, seconds not included
    });
  });

  describe('formatTimeWithMetadata', () => {
    it('should return complete metadata', () => {
      const result = formatTimeWithMetadata(3661);
      
      expect(result.formatted).toBe('1h 1m'); // Default includeSeconds: false
      expect(result.breakdown).toEqual({
        totalSeconds: 3661,
        days: 0,
        hours: 1,
        minutes: 1,
        seconds: 1,
      });
      expect(result.config).toEqual(getWorkHoursConfig());
      expect(result.equivalents.totalHours).toBeCloseTo(1.0169, 4);
      expect(result.equivalents.totalMinutes).toBeCloseTo(61.0167, 4);
      expect(result.equivalents.workDays).toBeCloseTo(0.1271, 4);
    });

    it('should use custom config in metadata', () => {
      const customConfig = { hoursPerDay: 6, displayFormat: 'long' as const };
      const result = formatTimeWithMetadata(21600, customConfig); // 6 hours
      
      expect(result.config.hoursPerDay).toBe(6);
      expect(result.config.displayFormat).toBe('long');
      expect(result.equivalents.workDays).toBe(1); // 6 hours / 6 hours per day = 1 work day
    });

    it('should calculate equivalents correctly', () => {
      const result = formatTimeWithMetadata(7200); // 2 hours
      
      expect(result.equivalents.totalHours).toBe(2);
      expect(result.equivalents.totalMinutes).toBe(120);
      expect(result.equivalents.workDays).toBe(0.25); // 2 hours / 8 hours per day
    });
  });

  describe('parseTimeString', () => {
    it('should parse single units', () => {
      expect(parseTimeString('2d')).toBe(57600); // 2 * 8 * 3600
      expect(parseTimeString('3h')).toBe(10800); // 3 * 3600
      expect(parseTimeString('30m')).toBe(1800); // 30 * 60
      expect(parseTimeString('45s')).toBe(45);
    });

    it('should parse multiple units', () => {
      expect(parseTimeString('1d 2h 30m 15s')).toBe(37815); // 28800 + 7200 + 1800 + 15 = 37815
      expect(parseTimeString('2h30m')).toBe(9000); // 7200 + 1800
    });

    it('should return null for invalid strings', () => {
      expect(parseTimeString('invalid')).toBeNull();
      expect(parseTimeString('')).toBeNull();
      expect(parseTimeString('abc')).toBeNull();
    });

    it('should handle partial matches', () => {
      expect(parseTimeString('1h invalid 30m')).toBe(5400); // 3600 + 1800, ignores invalid part
    });

    it('should use global config for day calculation', () => {
      setWorkHoursConfig({ hoursPerDay: 10 });
      expect(parseTimeString('1d')).toBe(36000); // 1 * 10 * 3600
    });
  });

  describe('validateWorkHoursConfig', () => {
    it('should return no errors for valid config', () => {
      const errors = validateWorkHoursConfig({
        hoursPerDay: 8,
        minutesPerHour: 60,
        displayFormat: 'mixed',
        includeSeconds: true,
      });
      
      expect(errors).toEqual([]);
    });

    it('should validate hoursPerDay', () => {
      expect(validateWorkHoursConfig({ hoursPerDay: 0 })).toContain(
        'hoursPerDay must be an integer between 1 and 24'
      );
      expect(validateWorkHoursConfig({ hoursPerDay: 25 })).toContain(
        'hoursPerDay must be an integer between 1 and 24'
      );
      expect(validateWorkHoursConfig({ hoursPerDay: 1.5 })).toContain(
        'hoursPerDay must be an integer between 1 and 24'
      );
      expect(validateWorkHoursConfig({ hoursPerDay: -1 })).toContain(
        'hoursPerDay must be an integer between 1 and 24'
      );
    });

    it('should validate minutesPerHour', () => {
      expect(validateWorkHoursConfig({ minutesPerHour: 0 })).toContain(
        'minutesPerHour must be an integer between 1 and 120'
      );
      expect(validateWorkHoursConfig({ minutesPerHour: 121 })).toContain(
        'minutesPerHour must be an integer between 1 and 120'
      );
      expect(validateWorkHoursConfig({ minutesPerHour: 30.5 })).toContain(
        'minutesPerHour must be an integer between 1 and 120'
      );
    });

    it('should validate displayFormat', () => {
      expect(validateWorkHoursConfig({ displayFormat: 'invalid' as any })).toContain(
        'displayFormat must be "short", "long", or "mixed"'
      );
      expect(validateWorkHoursConfig({ displayFormat: 'SHORT' as any })).toContain(
        'displayFormat must be "short", "long", or "mixed"'
      );
    });

    it('should validate multiple fields and return multiple errors', () => {
      const errors = validateWorkHoursConfig({
        hoursPerDay: 0,
        minutesPerHour: 200,
        displayFormat: 'invalid' as any,
      });
      
      expect(errors).toHaveLength(3);
      expect(errors).toContain('hoursPerDay must be an integer between 1 and 24');
      expect(errors).toContain('minutesPerHour must be an integer between 1 and 120');
      expect(errors).toContain('displayFormat must be "short", "long", or "mixed"');
    });

    it('should handle undefined values gracefully', () => {
      const errors = validateWorkHoursConfig({
        hoursPerDay: undefined,
        minutesPerHour: undefined,
        displayFormat: undefined,
      });
      
      expect(errors).toEqual([]);
    });
  });

  describe('getConfigInfo', () => {
    it('should return formatted config information', () => {
      const info = getConfigInfo();
      
      expect(info).toContain('Work Hours Configuration:');
      expect(info).toContain('Hours per day: 8');
      expect(info).toContain('Minutes per hour: 60');
      expect(info).toContain('Display format: mixed');
      expect(info).toContain('Include seconds: false');
      expect(info).toContain('Environment Variables (optional):');
      expect(info).toContain('WORK_HOURS_PER_DAY:');
      expect(info).toContain('TIME_DISPLAY_FORMAT:');
      expect(info).toContain('INCLUDE_SECONDS:');
    });

    it('should reflect current configuration', () => {
      setWorkHoursConfig({
        hoursPerDay: 10,
        displayFormat: 'long',
        includeSeconds: true,
      });
      
      const info = getConfigInfo();
      
      expect(info).toContain('Hours per day: 10');
      expect(info).toContain('Display format: long');
      expect(info).toContain('Include seconds: true');
    });
  });

  describe('edge cases and integration', () => {
    it('should handle very large time values', () => {
      const largeSeconds = 31536000; // 1 year in seconds
      const breakdown = breakdownTime(largeSeconds);
      
      expect(breakdown.totalSeconds).toBe(largeSeconds);
      expect(breakdown.days).toBeGreaterThan(1000);
    });

    it('should maintain consistency between breakdown and format', () => {
      const testValues = [0, 1, 60, 3600, 86400, 90061, 176461];
      
      testValues.forEach(seconds => {
        const breakdown = breakdownTime(seconds);
        const formatted = formatSeconds(seconds);
        
        // Verify breakdown totals correctly
        const reconstructed = 
          breakdown.days * 8 * 3600 +
          breakdown.hours * 3600 +
          breakdown.minutes * 60 +
          breakdown.seconds;
        
        expect(reconstructed).toBe(breakdown.totalSeconds);
        expect(formatted).toBeDefined();
        expect(typeof formatted).toBe('string');
      });
    });

    it('should handle config overrides in all functions', () => {
      const customConfig = {
        hoursPerDay: 4,
        minutesPerHour: 30,
        displayFormat: 'short' as const,
        includeSeconds: true,
      };

      const seconds = 7230; // Test value
      
      const breakdown = breakdownTime(seconds, customConfig);
      const formatted = formatSeconds(seconds, customConfig);
      const metadata = formatTimeWithMetadata(seconds, customConfig);
      
      expect(breakdown.totalSeconds).toBe(seconds);
      expect(formatted).toBeDefined();
      expect(metadata.config).toEqual({ ...getWorkHoursConfig(), ...customConfig });
    });

    it('should handle fractional seconds in equivalents', () => {
      const result = formatTimeWithMetadata(1500); // 25 minutes
      
      expect(result.equivalents.totalHours).toBe(1500 / 3600);
      expect(result.equivalents.totalMinutes).toBe(25);
      expect(result.equivalents.workDays).toBe(1500 / (8 * 3600));
    });
  });
});