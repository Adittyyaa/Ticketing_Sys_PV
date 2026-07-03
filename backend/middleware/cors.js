/**
 * CORS Configuration Middleware
 * Centralized CORS settings for the application
 */

import cors from 'cors'

/**
 * Development CORS configuration
 */
const developmentCorsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 hours
}

/**
 * Production CORS configuration
 */
const productionCorsOptions = {
  origin: process.env.FRONTEND_URL ? 
    process.env.FRONTEND_URL.split(',').map(url => url.trim()) :
    ['https://your-domain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 hours
}

/**
 * Get CORS options based on environment
 */
function getCorsOptions() {
  return process.env.NODE_ENV === 'production' ? 
    productionCorsOptions : 
    developmentCorsOptions
}

/**
 * Configured CORS middleware
 */
export const corsMiddleware = cors(getCorsOptions())

export default corsMiddleware
