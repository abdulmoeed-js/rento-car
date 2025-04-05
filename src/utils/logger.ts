
import { toast } from "sonner";

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

// Current log level (can be adjusted based on environment)
const currentLogLevel = process.env.NODE_ENV === 'production' 
  ? LogLevel.INFO 
  : LogLevel.DEBUG;

// Log types for categorizing operations
export enum LogType {
  AUTH = 'AUTH',
  BOOKING = 'BOOKING',
  CAR = 'CAR',
  ADMIN = 'ADMIN',
  USER = 'USER',
  SYSTEM = 'SYSTEM',
  KYC = 'KYC',
  PAYMENT = 'PAYMENT'
}

interface LogData {
  [key: string]: any;
}

/**
 * Main logging function
 */
export function log(
  level: LogLevel,
  type: LogType,
  message: string,
  data?: LogData
) {
  // Skip if below current log level
  if (level < currentLogLevel) return;

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: LogLevel[level],
    type,
    message,
    data
  };

  // Log to console with appropriate styling
  const logStyle = getLogStyle(level);
  
  if (level === LogLevel.ERROR) {
    console.error(
      `%c[${timestamp}] ${LogLevel[level]} [${type}]: ${message}`, 
      logStyle,
      data || ''
    );
  } else if (level === LogLevel.WARN) {
    console.warn(
      `%c[${timestamp}] ${LogLevel[level]} [${type}]: ${message}`, 
      logStyle,
      data || ''
    );
  } else {
    console.log(
      `%c[${timestamp}] ${LogLevel[level]} [${type}]: ${message}`, 
      logStyle,
      data || ''
    );
  }

  // In production, send logs to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // This would be where you'd send logs to a service like Sentry
    // sendToMonitoringService(logEntry);
  }

  // Optionally show toast for errors and warnings
  if (level === LogLevel.ERROR) {
    toast.error(`Error: ${message}`);
  }
}

// Convenience methods
export const logDebug = (type: LogType, message: string, data?: LogData) => 
  log(LogLevel.DEBUG, type, message, data);

export const logInfo = (type: LogType, message: string, data?: LogData) => 
  log(LogLevel.INFO, type, message, data);

export const logWarn = (type: LogType, message: string, data?: LogData) => 
  log(LogLevel.WARN, type, message, data);

export const logError = (type: LogType, message: string, data?: LogData) => 
  log(LogLevel.ERROR, type, message, data);

// Helper for console log styling
function getLogStyle(level: LogLevel): string {
  switch (level) {
    case LogLevel.DEBUG:
      return 'color: #6c757d'; // gray
    case LogLevel.INFO:
      return 'color: #0d6efd'; // blue
    case LogLevel.WARN:
      return 'color: #fd7e14; font-weight: bold'; // orange
    case LogLevel.ERROR:
      return 'color: #dc3545; font-weight: bold'; // red
    default:
      return '';
  }
}
