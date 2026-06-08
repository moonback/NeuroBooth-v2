export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: unknown;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private addEntry(level: LogLevel, message: string, data?: unknown) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
    };
    this.logs.push(entry);
    
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Log to console as well
    const consolePrefix = `[${level.toUpperCase()}] [${entry.timestamp.toLocaleTimeString()}]`;
    if (data) {
      console.log(consolePrefix, message, data);
    } else {
      console.log(consolePrefix, message);
    }
  }

  debug(message: string, data?: unknown) {
    this.addEntry('debug', message, data);
  }

  info(message: string, data?: unknown) {
    this.addEntry('info', message, data);
  }

  warn(message: string, data?: unknown) {
    this.addEntry('warn', message, data);
  }

  error(message: string, data?: unknown) {
    this.addEntry('error', message, data);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger();
