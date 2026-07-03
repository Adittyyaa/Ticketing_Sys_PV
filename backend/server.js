import 'dotenv/config'
import express from 'express'
import crypto from 'crypto'
import { checkConnection } from './lib/database.js'

// Import organized middleware
import { 
  errorHandler, 
  notFoundHandler,
  corsMiddleware,
  helmetConfig,
  getLoggerMiddleware,
  requestTiming,
  sanitizeRequest,
  rateLimiters
} from './middleware/index.js'

// Import organized routes
import apiRoutes from './routes/index.js'

const app = express()
const port = process.env.PORT || 3001

// ============================================
// REQUEST ID MIDDLEWARE (Must be first)
// ============================================

app.use((req, res, next) => {
  req.id = crypto.randomUUID()
  res.setHeader('X-Request-ID', req.id)
  next()
})

// ============================================
// SECURITY MIDDLEWARE
// ============================================

app.use(helmetConfig)

// ============================================
// CORS CONFIGURATION
// ============================================

app.use(corsMiddleware)

// ============================================
// REQUEST PROCESSING MIDDLEWARE
// ============================================

app.use(requestTiming)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(sanitizeRequest)

// ============================================
// RATE LIMITING
// ============================================

// Apply general rate limiting to all routes
app.use(rateLimiters.general)

// ============================================
// LOGGING MIDDLEWARE
// ============================================

if (process.env.NODE_ENV !== 'production') {
  app.use(getLoggerMiddleware())
}

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'PV Advisory Ticketing System API',
    version: process.env.npm_package_version || '1.0.0'
  })
})

// ============================================
// API ROUTES
// ============================================

app.use('/api', apiRoutes)

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

// 404 handler for unmatched routes
app.use('*', notFoundHandler)

// Global error handler (must be last)
app.use(errorHandler)

// ============================================
// SERVER STARTUP
// ============================================

async function startServer() {
  try {
    // Test database connection
    const dbConnected = await checkConnection()
    if (!dbConnected && process.env.NODE_ENV === 'production') {
      console.error('❌ Database connection failed. Exiting...')
      process.exit(1)
    }
    
    app.listen(port, () => {
      console.log('🚀 Server Information:')
      console.log(`   ✅ Server running on http://localhost:${port}`)
      console.log(`   📊 Health check: http://localhost:${port}/health`)
      console.log(`   📋 API docs: http://localhost:${port}/api/docs`)
      console.log(`   🔧 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`   💾 Database: ${dbConnected ? 'Connected' : 'Disconnected (dev mode)'}`)
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n📋 Available API Endpoints:')
        console.log('   POST /api/auth/login')
        console.log('   POST /api/auth/register')
        console.log('   GET  /api/auth/profile')
        console.log('   GET  /api/tickets')
        console.log('   POST /api/tickets')
        console.log('   GET  /api/admin/dashboard/stats')
        console.log('   GET  /api/docs - Full API documentation')
      }
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()