/**
 * Configurable time formatting system for work hour calculations
 * Supports different work hour standards and display formats
 */

export interface WorkHoursConfig {
  hoursPerDay: number;
  minutesPerHour: number;
  displayFormat: 'short' | 'long' | 'mixed';
  includeSeconds: boolean;
}

export interface TimeBreakdown {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Default work hours configuration
 * Can be overridden via environment variables or configuration
 */
const DEFAULT_CONFIG: WorkHoursConfig = {
  hoursPerDay: 8, // Standard 8-hour work day
  minutesPerHour: 60, // Standard 60-minute hour
  displayFormat: 'mixed', // Show days, hours, and minutes
  includeSeconds: false, // Don't show seconds by default
};

/**
 * Loads work hours configuration from environment variables
 */
function loadConfigFromEnv(): Partial<WorkHoursConfig> {
  const config: Partial<WorkHoursConfig> = {};

  if (process.env.WORK_HOURS_PER_DAY) {
    const value = parseInt(process.env.WORK_HOURS_PER_DAY, 10);
    if (!isNaN(value) && value > 0 && value <= 24) {
      config.hoursPerDay = value;
    }
  }

  if (process.env.TIME_DISPLAY_FORMAT) {
    const format = process.env.TIME_DISPLAY_FORMAT.toLowerCase();
    if (['short', 'long', 'mixed'].includes(format)) {
      config.displayFormat = format as 'short' | 'long' | 'mixed';
    }
  }

  if (process.env.INCLUDE_SECONDS) {
    config.includeSeconds = process.env.INCLUDE_SECONDS.toLowerCase() === 'true';
  }

  return config;
}

/**
 * Global configuration with environment overrides
 */
let globalConfig: WorkHoursConfig = {
  ...DEFAULT_CONFIG,
  ...loadConfigFromEnv(),
};

/**
 * Updates the global work hours configuration
 */
export function setWorkHoursConfig(config: Partial<WorkHoursConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Gets the current work hours configuration
 */
export function getWorkHoursConfig(): WorkHoursConfig {
  return { ...globalConfig };
}

/**
 * Converts seconds to a time breakdown based on work hours configuration
 */
export function breakdownTime(
  totalSeconds: number,
  config?: Partial<WorkHoursConfig>
): TimeBreakdown {
  const activeConfig = { ...globalConfig, ...config };

  if (totalSeconds < 0) {
    totalSeconds = 0;
  }

  const secondsPerMinute = 60;
  const secondsPerHour = activeConfig.minutesPerHour * secondsPerMinute;
  const secondsPerDay = activeConfig.hoursPerDay * secondsPerHour;

  const days = Math.floor(totalSeconds / secondsPerDay);
  const remainingAfterDays = totalSeconds % secondsPerDay;

  const hours = Math.floor(remainingAfterDays / secondsPerHour);
  const remainingAfterHours = remainingAfterDays % secondsPerHour;

  const minutes = Math.floor(remainingAfterHours / secondsPerMinute);
  const seconds = remainingAfterHours % secondsPerMinute;

  return {
    totalSeconds,
    days,
    hours,
    minutes,
    seconds,
  };
}

/**
 * Formats seconds into a human-readable string
 */
export function formatSeconds(totalSeconds: number, config?: Partial<WorkHoursConfig>): string {
  const activeConfig = { ...globalConfig, ...config };
  const breakdown = breakdownTime(totalSeconds, activeConfig);

  if (totalSeconds === 0) {
    return activeConfig.displayFormat === 'long' ? '0 minutes' : '0m';
  }

  const parts: string[] = [];

  // Add days
  if (breakdown.days > 0) {
    if (activeConfig.displayFormat === 'long') {
      parts.push(`${breakdown.days} day${breakdown.days !== 1 ? 's' : ''}`);
    } else {
      parts.push(`${breakdown.days}d`);
    }
  }

  // Add hours
  if (breakdown.hours > 0) {
    if (activeConfig.displayFormat === 'long') {
      parts.push(`${breakdown.hours} hour${breakdown.hours !== 1 ? 's' : ''}`);
    } else {
      parts.push(`${breakdown.hours}h`);
    }
  }

  // Add minutes
  if (breakdown.minutes > 0) {
    if (activeConfig.displayFormat === 'long') {
      parts.push(`${breakdown.minutes} minute${breakdown.minutes !== 1 ? 's' : ''}`);
    } else {
      parts.push(`${breakdown.minutes}m`);
    }
  }

  // Add seconds if enabled
  if (activeConfig.includeSeconds && breakdown.seconds > 0) {
    if (activeConfig.displayFormat === 'long') {
      parts.push(`${breakdown.seconds} second${breakdown.seconds !== 1 ? 's' : ''}`);
    } else {
      parts.push(`${breakdown.seconds}s`);
    }
  }

  // Handle display format
  if (activeConfig.displayFormat === 'short' || parts.length === 0) {
    // Show only the largest unit
    if (breakdown.days > 0) return `${breakdown.days}d`;
    if (breakdown.hours > 0) return `${breakdown.hours}h`;
    if (breakdown.minutes > 0) return `${breakdown.minutes}m`;
    if (activeConfig.includeSeconds && breakdown.seconds > 0) return `${breakdown.seconds}s`;
    return '0m';
  }

  if (activeConfig.displayFormat === 'long') {
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return parts.join(' and ');
    return parts.slice(0, -1).join(', ') + ', and ' + parts[parts.length - 1];
  }

  // Mixed format (default)
  return parts.join(' ');
}
