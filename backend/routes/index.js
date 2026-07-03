/**
 * Routes index for centralized route management
 * This file serves as the central export point for all routes
 */

import { Router } from 'express';

// Import individual route modules
import authRoutes from './auth.js';
import ticketRoutes from './tickets.js';
import adminRoutes from './admin.js';
import solutionRoutes from './solutions.js';
import feedbackRoutes from './feedback.js';

// Create main router
const router = Router();

// ============================================
// API ROUTE MOUNTING
// ============================================

// Authentication routes
router.use('/auth', authRoutes);

// Ticket management routes
router.use('/tickets', ticketRoutes);

// Administrative routes
router.use('/admin', adminRoutes);

// Knowledge base solutions
router.use('/solutions', solutionRoutes);

// User feedback routes
router.use('/feedback', feedbackRoutes);

// ============================================
// ROUTE HEALTH CHECK
// ============================================

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    routes: {
      auth: '/api/auth',
      tickets: '/api/tickets',
      admin: '/api/admin',
      solutions: '/api/solutions',
      feedback: '/api/feedback'
    },
    version: process.env.npm_package_version || '1.0.0'
  });
});

// ============================================
// ROUTE DOCUMENTATION ENDPOINT
// ============================================

router.get('/docs', (req, res) => {
  res.json({
    title: 'PV Advisory Ticketing System API',
    version: process.env.npm_package_version || '1.0.0',
    endpoints: {
      auth: {
        base: '/api/auth',
        endpoints: [
          'POST /login',
          'POST /register',
          'POST /logout',
          'GET /validate',
          'POST /change-password',
          'POST /request-password-reset',
          'POST /reset-password',
          'GET /profile'
        ]
      },
      tickets: {
        base: '/api/tickets',
        endpoints: [
          'GET /',
          'GET /search',
          'GET /analytics',
          'GET /recent',
          'GET /my-tickets',
          'GET /assigned-to-me',
          'GET /:id',
          'POST /',
          'PUT /:id',
          'DELETE /:id',
          'POST /:id/assign'
        ]
      },
      admin: {
        base: '/api/admin',
        endpoints: [
          'GET /tickets',
          'GET /tickets/:id',
          'PUT /tickets/:id',
          'DELETE /tickets/:id',
          'POST /tickets/bulk-delete',
          'POST /tickets/:id/assign',
          'GET /users',
          'GET /users/:id',
          'PUT /users/:id',
          'PUT /users/:id/role',
          'DELETE /users/:id',
          'POST /users/:id/verify-email',
          'GET /dashboard/stats',
          'GET /dashboard/activity',
          'GET /system/health'
        ]
      },
      solutions: {
        base: '/api/solutions',
        endpoints: [
          'GET /',
          'GET /search/:query',
          'GET /category/:categoryId',
          'GET /tag/:tag',
          'GET /:id',
          'POST /',
          'POST /:id/helpful',
          'GET /admin/all'
        ]
      },
      feedback: {
        base: '/api/feedback',
        endpoints: [
          'POST /',
          'GET /ticket/:ticketId',
          'GET /solution/:solutionId',
          'GET /my-feedback',
          'PUT /:id',
          'DELETE /:id',
          'GET /stats/overview'
        ]
      }
    }
  });
});

export default router;
