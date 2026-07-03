/**
 * Validation middleware functions
 */

/**
 * Validate pagination parameters
 */
export function validatePagination(req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  // Ensure valid bounds
  req.pagination = {
    page: Math.max(1, page),
    limit: Math.min(Math.max(1, limit), 100) // Max 100 items per page
  };

  next();
}

/**
 * Validate ticket creation data
 */
export function validateTicketCreation(req, res, next) {
  const { title, description } = req.body;

  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 1) {
    errors.push('Title is required');
  }

  if (!description || typeof description !== 'string' || description.trim().length < 1) {
    errors.push('Description is required');
  }

  if (title && title.length > 255) {
    errors.push('Title must be less than 255 characters');
  }

  if (description && description.length > 5000) {
    errors.push('Description must be less than 5000 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
}

/**
 * Validate user registration data
 */
export function validateUserRegistration(req, res, next) {
  const { email, password, full_name } = req.body;

  const errors = [];

  // Email validation
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  }

  // Password validation
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Full name validation
  if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 1) {
    errors.push('Full name is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
}

/**
 * Validate login data
 */
export function validateLogin(req, res, next) {
  const { email, password } = req.body;

  const errors = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
}

/**
 * Sanitize input data
 */
export function sanitizeInput(req, res, next) {
  // Trim string fields in body
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }

  next();
}
