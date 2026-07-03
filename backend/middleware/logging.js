/**
 * Logging Middleware
 * Request/response logging and audit trails
 */

import morgan from 'morgan'

/**
 * Custom token for user ID in logs
 */
morgan.token('user-id', (req) => {
  return req.user ? req.user.id : 'anonymous'
})

/**
 * Custom token for user role in logs
 */
morgan.token('user-role', (req) => {
  return req.user ? req.user.role : 'none'
})

/**
 * Custom token for request duration
 */
morgan.token('duration', (req, _res) => {
  if (!req._startTime) return '0ms'
  const duration = Date.now() - req._startTime
  return `${duration}ms`
})

/**
 * Development logging format
 */
const developmentFormat = morgan.compile([
  ':method :url :status :res[content-length] - :response-time ms',
  '[:user-id/:user-role]'
].join(' '))

/**
 * Production logging format
 */
const productionFormat = morgan.compile([
  ':remote-addr - :remote-user [:date[clf]]',
  '":method :url HTTP/:http-version" :status :res[content-length]',
  '":referrer" ":user-agent" :user-id/:user-role :duration'
].join(' '))

/**
 * Get logging middleware based on environment
 */
export function getLoggerMiddleware() {
  if (process.env.NODE_ENV === 'production') {
    return morgan(productionFormat, {
      stream: {
        write: (message) => {
          // In production, you might want to write to a file or external service
          console.log(message.trim())
        }
      }
    })
  } else {
    return morgan(developmentFormat)
  }
}

/**
 * Request timing middleware
 */
export function requestTiming(req, res, next) {
  req._startTime = Date.now()
  next()
}

/**
 * Simple logger for application logs
 */
export const logger = {
  info: (message, ...args) => console.log('[INFO]', message, ...args),
  error: (message, ...args) => console.error('[ERROR]', message, ...args),
  warn: (message, ...args) => console.warn('[WARN]', message, ...args),
  debug: (message, ...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DEBUG]', message, ...args)
    }
  }
}

export default getLoggerMiddleware
