import { Router  } from 'express';
import { authenticate, requireAgent  } from '../middleware/auth.js';
import { validateTicketCreation, 
  validatePagination, 
  sanitizeInput 
 } from '../middleware/validation.js';
import { asyncHandler  } from '../utils/helpers.js';
import * as ticketController from '../controllers/ticketController.js';

const router = Router();

// All ticket routes require authentication
router.use(authenticate);

// Get all tickets (with pagination and filters)
router.get('/', 
  validatePagination,
  asyncHandler(ticketController.getTickets)
);

// Search tickets
router.get('/search', 
  validatePagination,
  asyncHandler(ticketController.searchTickets)
);

// Get ticket analytics (agent/admin only)
router.get('/analytics', 
  requireAgent,
  asyncHandler(ticketController.getTicketAnalytics)
);

// Get recent tickets (agent/admin only)
router.get('/recent', 
  requireAgent,
  asyncHandler(ticketController.getRecentTickets)
);

// Get current user's tickets
router.get('/my-tickets', 
  validatePagination,
  asyncHandler(ticketController.getMyTickets)
);

// Get tickets assigned to current user (agent/admin only)
router.get('/assigned-to-me', 
  requireAgent,
  validatePagination,
  asyncHandler(ticketController.getAssignedTickets)
);

// Get single ticket by ID
router.get('/:id', 
  asyncHandler(ticketController.getTicketById)
);

// Create new ticket
router.post('/', 
  sanitizeInput,
  validateTicketCreation,
  asyncHandler(ticketController.createTicket)
);

// Update ticket
router.put('/:id', 
  sanitizeInput,
  asyncHandler(ticketController.updateTicket)
);

// Delete ticket
router.delete('/:id', 
  asyncHandler(ticketController.deleteTicket)
);

// Assign ticket to agent (agent/admin only)
router.post('/:id/assign', 
  requireAgent,
  sanitizeInput,
  asyncHandler(ticketController.assignTicket)
);

// Comment routes
router.get('/:id/comments', 
  asyncHandler(ticketController.getTicketComments)
);

router.post('/:id/comments', 
  sanitizeInput,
  asyncHandler(ticketController.addTicketComment)
);

export default router;
