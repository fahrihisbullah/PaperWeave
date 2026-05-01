export function log(level: 'info' | 'warn' | 'error' | 'debug', message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta,
  }
  
  switch (level) {
    case 'error':
      console.error(JSON.stringify(logEntry))
      break
    case 'warn':
      console.warn(JSON.stringify(logEntry))
      break
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        console.debug(JSON.stringify(logEntry))
      }
      break
    default:
      console.log(JSON.stringify(logEntry))
  }
  
  return logEntry
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
}