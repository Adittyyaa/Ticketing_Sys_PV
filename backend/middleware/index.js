/**
 * Middleware exports for easy importing
 * This file serves as the central export point for all middleware
 */

// Authentication & Authorization Middleware
export * from './auth.js'

// Request Validation Middleware
export * from './validation.js'

// Error Handling Middleware
export * from './errorHandler.js'

// Security Middleware
export * from './security.js'

// CORS Configuration
export * from './cors.js'

// Logging Middleware
export * from './logging.js'

// Common middleware combinations for routes
export { authenticate, requireAdmin, requireAgent } from './auth.js'
export { validatePagination, validateTicketCreation, validateUserRegistration, validateLogin, sanitizeInput } from './validation.js'
export { errorHandler, notFoundHandler, asyncHandler } from './errorHandler.js'
export { rateLimiters, helmetConfig, sanitizeRequest } from './security.js'
export { corsMiddleware } from './cors.js'
export { getLoggerMiddleware, requestTiming } from './logging.js'
