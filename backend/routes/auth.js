import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { 
  validateLogin, 
  validateUserRegistration, 
  sanitizeInput 
} from '../middleware/validation.js';
import { rateLimiters } from '../middleware/security.js';
import { asyncHandler } from '../utils/helpers.js';
import * as authController from '../controllers/authController.js';

const router = Router();

// Public routes
router.post('/login', 
  rateLimiters.auth,
  sanitizeInput,
  validateLogin,
  asyncHandler(authController.login)
);

router.post('/register', 
  sanitizeInput,
  validateUserRegistration,
  asyncHandler(authController.register)
);

router.post('/request-password-reset',
  rateLimiters.passwordReset,
  sanitizeInput,
  asyncHandler(authController.requestPasswordReset)
);

router.post('/reset-password',
  rateLimiters.passwordReset,
  sanitizeInput,
  asyncHandler(authController.resetPassword)
);

// Protected routes (require authentication)
router.post('/logout', 
  authenticate,
  asyncHandler(authController.logout)
);

router.get('/validate', 
  authenticate,
  asyncHandler(authController.validateToken)
);

router.get('/profile',
  authenticate,
  asyncHandler(authController.getProfile)
);

router.post('/change-password', 
  authenticate,
  sanitizeInput,
  asyncHandler(authController.changePassword)
);

export default router;
