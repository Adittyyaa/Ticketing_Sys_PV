# Code Organization Guide

## Overview

The backend codebase has been reorganized to follow clean architecture principles with proper separation of concerns:

```
Routes → Controllers → Services → Models
```

## Directory Structure

```
backend/src/
├── routes/          # HTTP route definitions (thin layer)
├── controllers/     # Request/response handling and validation
├── services/        # Business logic and data operations
├── models/          # Database models (Sequelize)
├── middleware/      # Express middleware (auth, validation, error handling)
├── lib/             # Core libraries (database connection)
├── utils/           # Shared helper utilities
└── config/          # Configuration files
```

## Architecture Layers

### 1. Routes (`src/routes/`)
**Responsibility:** Define API endpoints and apply middleware

**What they should do:**
- Define HTTP routes (GET, POST, PUT, DELETE)
- Apply middleware (authentication, validation, sanitization)
- Delegate to controllers using `asyncHandler`
- Keep logic minimal

**What they should NOT do:**
- Handle business logic
- Interact directly with services
- Validate data (use middleware)
- Handle errors (use asyncHandler)

**Example:**
```javascript
router.post('/', 
  authenticate,
  sanitizeInput,
  validateTicketCreation,
  asyncHandler(ticketController.createTicket)
);
```

### 2. Controllers (`src/controllers/`)
**Responsibility:** Handle HTTP requests and responses

**What they should do:**
- Extract data from requests (req.body, req.params, req.query)
- Use helper functions from `utils/helpers.js`
- Call services with extracted data
- Manage database transactions
- Format responses consistently
- Log operations and errors
- Return proper HTTP status codes

**What they should NOT do:**
- Contain business logic
- Directly query the database (use services)
- Duplicate helper functions (use utils)

**Example:**
```javascript
const createTicket = async (req, res) => {
  const requestId = req.id;
  
  try {
    const { userId } = getUserInfo(req);
    const ticketData = req.body;

    const validationErrors = validateTicketData(ticketData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    const result = await db.transaction(async (transaction) => {
      const ticket = await ticketService.createTicket(userId, ticketData, transaction);
      return ticket;
    });

    logger.info('Ticket created successfully', {
      controller: 'ticket',
      method: 'createTicket',
      userId: userId,
      ticketId: result.id,
      requestId: requestId,
    });

    return res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error in createTicket Controller', {
      controller: 'ticket',
      method: 'createTicket',
      error: error.message,
      stack: error.stack,
      requestId: requestId,
    });

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
```

### 3. Services (`src/services/`)
**Responsibility:** Contain business logic and data operations

**What they should do:**
- Implement business logic
- Interact with models (database)
- Validate business rules
- Handle complex operations
- Be reusable across controllers

**What they should NOT do:**
- Handle HTTP requests/responses
- Return HTTP status codes
- Log HTTP-specific details (use generic logs)

### 4. Models (`src/models/`)
**Responsibility:** Define database schema and relationships

**What they should do:**
- Define Sequelize models
- Define table relationships
- Define validation rules
- Include model-level methods

### 5. Middleware (`src/middleware/`)
**Responsibility:** Process requests before they reach controllers

**Available middleware:**
- `auth.js` - Authentication and authorization
  - `authenticate` - Verify JWT token
  - `requireAdmin` - Require admin role
  - `requireAgent` - Require agent or admin role
  
- `validation.js` - Input validation
  - `validatePagination` - Validate page/limit params
  - `validateTicketCreation` - Validate ticket data
  - `validateUserRegistration` - Validate registration data
  - `validateLogin` - Validate login credentials
  - `sanitizeInput` - Trim string inputs

- `logging.js` - Request logging
- `errorHandler.js` - Global error handling
- `cors.js` - CORS configuration
- `security.js` - Security headers

### 6. Utils (`src/utils/`)
**Responsibility:** Shared helper functions

**Available helpers in `helpers.js`:**
- `getUserInfo(req)` - Extract user from request
- `getPaginationParams(req)` - Parse pagination
- `getFilters(req)` - Extract query filters
- `sanitizeUserResponse(user)` - Remove sensitive data
- `checkAdminPermission(role)` - Check if admin
- `checkAgentPermission(role)` - Check if agent/admin
- `validatePasswordStrength(password)` - Password validation
- `validateTicketData(ticketData)` - Ticket validation
- `validateSolutionInput(...)` - Solution validation
- `validateFeedbackInput(...)` - Feedback validation
- `asyncHandler(fn)` - Async error handler wrapper

## Best Practices

### 1. Controller Pattern
```javascript
const someAction = async (req, res) => {
  const requestId = req.id;
  
  try {
    // 1. Extract user info using helpers
    const { userId, role } = getUserInfo(req);
    
    // 2. Extract and validate data
    const data = req.body;
    const validationErrors = validateData(data);
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, errors: validationErrors });
    }
    
    // 3. Call service with transaction if needed
    const result = await db.transaction(async (transaction) => {
      return await someService.doSomething(userId, data, transaction);
    });
    
    // 4. Log success
    logger.info('Action completed', {
      controller: 'controllerName',
      method: 'someAction',
      userId,
      requestId
    });
    
    // 5. Return success response
    return res.status(200).json({
      success: true,
      message: 'Action completed successfully',
      data: result
    });
    
  } catch (error) {
    // 6. Log error
    logger.error('Error in someAction', {
      controller: 'controllerName',
      method: 'someAction',
      error: error.message,
      stack: error.stack,
      requestId
    });
    
    // 7. Return error response
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

### 2. Use Helper Functions
**Instead of duplicating:**
```javascript
// ❌ Don't do this in every controller
const getUserInfo = (req) => {
  return {
    userId: req.user?.id,
    role: req.user?.role
  };
};
```

**Use the shared helper:**
```javascript
// ✅ Do this
const { getUserInfo } = require('../utils/helpers');
```

### 3. Consistent Response Format
```javascript
// Success response
{
  success: true,
  message: 'Operation completed',
  data: { ... }
}

// Error response
{
  success: false,
  message: 'Error description',
  errors: [ ... ] // optional validation errors
}
```

### 4. Transaction Handling
```javascript
// Wrap database operations in transactions
const result = await db.transaction(async (transaction) => {
  const item1 = await service1.create(data, transaction);
  const item2 = await service2.create(item1.id, transaction);
  return { item1, item2 };
});
```

### 5. Logging Pattern
```javascript
// Success logs
logger.info('Descriptive message', {
  controller: 'controllerName',
  method: 'methodName',
  userId: userId,
  requestId: requestId,
  // additional context
});

// Error logs
logger.error('Error message', {
  controller: 'controllerName',
  method: 'methodName',
  error: error.message,
  stack: error.stack,
  requestId: requestId,
  // additional context
});
```

## Migration Checklist

When creating new features, follow this checklist:

- [ ] Create/update model in `models/` if needed
- [ ] Create/update service in `services/` with business logic
- [ ] Create/update controller in `controllers/` to handle requests
- [ ] Create/update route in `routes/` with proper middleware
- [ ] Use helpers from `utils/helpers.js` (don't duplicate)
- [ ] Add validation middleware if needed
- [ ] Use `asyncHandler` for all async route handlers
- [ ] Wrap database operations in transactions
- [ ] Add proper logging (info for success, error for failures)
- [ ] Return consistent response format
- [ ] Test all endpoints

## Common Mistakes to Avoid

1. **Don't put controller logic in routes**
   - Routes should only define endpoints and middleware
   - Business logic belongs in controllers and services

2. **Don't duplicate helper functions**
   - Use `utils/helpers.js` for shared utilities
   - Import helpers in controllers, don't redefine them

3. **Don't mix ES6 and CommonJS modules**
   - Backend uses CommonJS (`require`/`module.exports`)
   - Stay consistent throughout

4. **Don't skip error handling**
   - Always use try-catch in controllers
   - Always use `asyncHandler` in routes
   - Always log errors with context

5. **Don't forget transactions**
   - Wrap multi-step operations in transactions
   - Pass transaction to service methods

## File Naming Conventions

- Routes: `plural-noun.js` (e.g., `tickets.js`, `users.js`)
- Controllers: `singularNounController.js` (e.g., `ticketController.js`)
- Services: `singularNounService.js` (e.g., `ticketService.js`)
- Models: `PascalCase.js` (e.g., `Ticket.js`, `User.js`)
- Middleware: `descriptive-name.js` (e.g., `auth.js`, `validation.js`)
- Utils: `descriptive-name.js` (e.g., `helpers.js`)
