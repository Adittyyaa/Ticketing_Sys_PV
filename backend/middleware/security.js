/**
 * Security Middleware
 * Additional security layers for the application
 */

import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

/**
 * Rate limiting configurations
 */
export const rateLimiters = {
  // General API rate limiting
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 10000, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests',
      message: 'Please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
  }),

  // Authentication endpoints (more restrictive)
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 5 : 1000, // limit each IP to 5 login attempts per windowMs
    message: {
      error: 'Too many authentication attempts',
      message: 'Please try again in 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
  }),

  // Password reset (very restrictive)
  passwordReset: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: process.env.NODE_ENV === 'production' ? 3 : 1000, // limit each IP to 3 password reset attempts per hour
    message: {
      error: 'Too many password reset attempts',
      message: 'Please try again in 1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false
  }),

  // File upload endpoints
  upload: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 10 : 1000, // limit each IP to 10 uploads per windowMs
    message: {
      error: 'Too many file uploads',
      message: 'Please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
  })
}

/**
 * Helmet security configuration
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
})

/**
 * Request sanitization middleware
 */
export function sanitizeRequest(req, res, next) {
  // Remove potentially dangerous characters from query params
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].replace(/[<>]/g, '')
      }
    })
  }

  // Remove potentially dangerous characters from body
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim()
      }
    })
  }

  next()
}

export default {
  rateLimiters,
  helmetConfig,
  sanitizeRequest
}
