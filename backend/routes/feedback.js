import { Router  } from 'express';
import { authenticate, requireAdmin  } from '../middleware/auth.js';
import { asyncHandler  } from '../utils/helpers.js';
import * as feedbackController from '../controllers/feedbackController.js';

const router = Router();

// All feedback routes require authentication
router.use(authenticate);

// Submit feedback
router.post('/', 
  asyncHandler(feedbackController.createFeedback)
);

// Get feedback for a ticket
router.get('/ticket/:ticketId', 
  asyncHandler(feedbackController.getTicketFeedback)
);

// Get feedback for a solution
router.get('/solution/:solutionId', 
  asyncHandler(feedbackController.getSolutionFeedback)
);

// Get user's feedback history
router.get('/my-feedback', 
  asyncHandler(feedbackController.getMyFeedback)
);

// Update feedback
router.put('/:id', 
  asyncHandler(feedbackController.updateFeedback)
);

// Delete feedback
router.delete('/:id', 
  asyncHandler(feedbackController.deleteFeedback)
);

// Get feedback statistics (admin only)
router.get('/stats/overview', 
  requireAdmin,
  asyncHandler(feedbackController.getFeedbackOverview)
);

export default router;
