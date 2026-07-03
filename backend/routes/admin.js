import { Router  } from 'express';
import { requireAdmin  } from '../middleware/auth.js';
import { validatePagination, 
  sanitizeInput 
 } from '../middleware/validation.js';
import { asyncHandler  } from '../utils/helpers.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

// All admin routes require admin authentication
router.use(requireAdmin);

// ============================================
// TICKET MANAGEMENT
// ============================================

router.get('/tickets', 
  validatePagination,
  asyncHandler(adminController.getAllTickets)
);

router.get('/tickets/:id', 
  asyncHandler(adminController.getTicketById)
);

router.put('/tickets/:id', 
  sanitizeInput,
  asyncHandler(adminController.updateTicket)
);

router.delete('/tickets/:id', 
  asyncHandler(adminController.deleteTicket)
);

router.post('/tickets/bulk-delete', 
  sanitizeInput,
  asyncHandler(adminController.bulkDeleteTickets)
);

router.post('/tickets/:id/assign', 
  sanitizeInput,
  asyncHandler(adminController.assignTicket)
);

// Comment management
router.get('/tickets/:id/comments', 
  asyncHandler(adminController.getTicketComments)
);

router.post('/tickets/:id/comments', 
  sanitizeInput,
  asyncHandler(adminController.addTicketComment)
);

router.delete('/comments/:id', 
  asyncHandler(adminController.deleteComment)
);

// Attachments
router.get('/tickets/:id/attachments', 
  asyncHandler(adminController.getTicketAttachments)
);

// ============================================
// USER MANAGEMENT
// ============================================

router.get('/users', 
  validatePagination,
  asyncHandler(adminController.getAllUsers)
);

router.post('/users',
  sanitizeInput,
  asyncHandler(adminController.createUser)
);

router.get('/users/:id', 
  asyncHandler(adminController.getUserById)
);

router.put('/users/:id', 
  sanitizeInput,
  asyncHandler(adminController.updateUser)
);

router.put('/users/:id/role', 
  sanitizeInput,
  asyncHandler(adminController.updateUserRole)
);

router.delete('/users/:id', 
  asyncHandler(adminController.deleteUser)
);

router.post('/users/:id/verify-email', 
  asyncHandler(adminController.verifyUserEmail)
);

// ============================================
// DASHBOARD & ANALYTICS
// ============================================

router.get('/dashboard/stats', 
  asyncHandler(adminController.getDashboardStats)
);

router.get('/dashboard/activity', 
  asyncHandler(adminController.getDashboardActivity)
);

router.get('/system/health', 
  asyncHandler(adminController.getSystemHealth)
);

// ============================================
// SYSTEM SETTINGS (CATEGORIES, TAGS, STATUSES)
// ============================================

router.get('/categories', asyncHandler(adminController.getCategories));
router.post('/categories', sanitizeInput, asyncHandler(adminController.createCategory));
router.put('/categories', sanitizeInput, asyncHandler(adminController.updateCategory));
router.delete('/categories', asyncHandler(adminController.deleteCategory));
router.post('/seed', asyncHandler(adminController.seedCategories));

router.get('/tags', asyncHandler(adminController.getTags));
router.post('/tags', sanitizeInput, asyncHandler(adminController.createTag));
router.put('/tags', sanitizeInput, asyncHandler(adminController.updateTag));
router.delete('/tags', asyncHandler(adminController.deleteTag));

router.get('/custom-statuses', asyncHandler(adminController.getCustomStatuses));
router.post('/custom-statuses', sanitizeInput, asyncHandler(adminController.createCustomStatus));
router.put('/custom-statuses', sanitizeInput, asyncHandler(adminController.updateCustomStatus));
router.delete('/custom-statuses', asyncHandler(adminController.deleteCustomStatus));

router.get('/ticket-types', asyncHandler(adminController.getTicketTypes));

export default router;
