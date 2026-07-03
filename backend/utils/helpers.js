
export const getUserInfo = (req) => {
  return {
    userId: req.user?.id,
    email: req.user?.email,
    role: req.user?.role
  };
};


export const getPaginationParams = (req) => {
  return {
    page: req.pagination?.page || parseInt(req.query.page) || 1,
    limit: req.pagination?.limit || parseInt(req.query.limit) || 20
  };
};


export const getFilters = (req) => {
  const filters = {};
  
  if (req.query.status) filters.status = req.query.status;
  if (req.query.priority) filters.priority = req.query.priority;
  if (req.query.category_id) filters.category_id = req.query.category_id;
  if (req.query.user_id) filters.user_id = req.query.user_id;
  if (req.query.assigned_to) filters.assigned_to = req.query.assigned_to;
  if (req.query.search) filters.search = req.query.search;
  if (req.query.role) filters.role = req.query.role;
  if (req.query.category) filters.category_id = req.query.category;
  if (req.query.email_verified !== undefined) {
    filters.email_verified = req.query.email_verified === 'true';
  }
  
  return filters;
};


export const sanitizeUserResponse = (user) => {
  // eslint-disable-next-line no-unused-vars
  const { password_hash, ...safeUser } = user;
  return safeUser;
};


export const checkAdminPermission = (role) => {
  return role === 'admin';
};

export const validatePasswordStrength = (password) => {
  if (!password || password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  return { isValid: true };
};


export const validateTicketData = (ticketData) => {
  const errors = [];
  
  if (!ticketData.title || ticketData.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (!ticketData.description || ticketData.description.trim().length === 0) {
    errors.push('Description is required');
  }
  
  if (ticketData.title && ticketData.title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }
  
  if (ticketData.description && ticketData.description.length > 2000) {
    errors.push('Description must be less than 2000 characters');
  }
  
  return errors;
};

/**
 * Validate solution input
 */
export const validateSolutionInput = (title, description, steps) => {
  const errors = [];
  
  if (!title || title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (!description || description.trim().length === 0) {
    errors.push('Description is required');
  }
  
  if (!steps || steps.length === 0) {
    errors.push('Steps are required');
  }
  
  if (title && title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }
  
  if (description && description.length > 2000) {
    errors.push('Description must be less than 2000 characters');
  }
  
  return errors;
};

export const validateFeedbackInput = (ticket_id, solution_id, rating, comment, options = {}) => {
  const errors = [];
  
  if (!options.partial && !ticket_id && !solution_id) {
    errors.push('Either ticket_id or solution_id is required');
  }
  
  if (rating && (rating < 1 || rating > 5)) {
    errors.push('Rating must be between 1 and 5');
  }
  
  if (comment && comment.length > 1000) {
    errors.push('Comment must be less than 1000 characters');
  }
  
  return errors;
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
