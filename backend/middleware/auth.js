import { authService } from '../services/authService.js';

/**
 * Authentication middleware
 * Validates JWT token and attaches user to request
 */
export async function authenticate(req, res, next) {
  try {
    const user = await authService.validateAuthToken(req.headers.authorization);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(401).json({ 
      success: false,
      error: 'Invalid authentication token' 
    });
  }
}

/**
 * Admin authorization middleware
 * Requires user to be authenticated and have admin role
 */
export async function requireAdmin(req, res, next) {
  try {
    const user = await authService.validateAuthToken(req.headers.authorization);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Admin access required' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(403).json({ 
      success: false,
      error: 'Access denied' 
    });
  }
}

/**
 * Agent authorization middleware
 * Requires user to be authenticated and have admin or agent role
 */
export async function requireAgent(req, res, next) {
  try {
    const user = await authService.validateAuthToken(req.headers.authorization);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    if (user.role !== 'admin' && user.role !== 'agent') {
      return res.status(403).json({ 
        success: false,
        error: 'Agent access required' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Agent middleware error:', error);
    res.status(403).json({ 
      success: false,
      error: 'Access denied' 
    });
  }
}
