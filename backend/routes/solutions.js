import { Router  } from 'express';
import { authenticate, requireAdmin  } from '../middleware/auth.js';
import { asyncHandler  } from '../utils/helpers.js';
import * as solutionController from '../controllers/solutionController.js';

const router = Router();

// Public routes - Get published solutions
router.get('/', 
  asyncHandler(solutionController.getSolutions)
);

router.get('/search/:query', 
  asyncHandler(solutionController.searchSolutions)
);

router.get('/category/:categoryId', 
  asyncHandler(solutionController.getSolutionsByCategory)
);

router.get('/tag/:tag', 
  asyncHandler(solutionController.getSolutionsByTag)
);

// Admin routes - includes unpublished solutions
router.get('/admin/all', 
  requireAdmin,
  asyncHandler(solutionController.getAllSolutions)
);

router.get('/:id', 
  asyncHandler(solutionController.getSolutionById)
);

// Authenticated routes
router.post('/', 
  authenticate,
  asyncHandler(solutionController.createSolution)
);

router.put('/', 
  authenticate,
  asyncHandler(solutionController.updateSolution)
);

router.delete('/', 
  authenticate,
  asyncHandler(solutionController.deleteSolution)
);

router.post('/:id/helpful', 
  authenticate,
  asyncHandler(solutionController.markSolutionHelpful)
);

export default router;
