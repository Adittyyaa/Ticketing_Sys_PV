import { ticketService  } from '../services/ticketService.js';
import { userService  } from '../services/userService.js';
import { commentService } from '../services/commentService.js';
import db, { safeQuery } from '../lib/database.js';
import { logger  } from '../middleware/logging.js';
import { getUserInfo, 
  getPaginationParams, 
  getFilters, 
  sanitizeUserResponse, 
  checkAdminPermission 
 } from '../utils/helpers.js';

const getAllTickets = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId, role } = getUserInfo(req);
    
    if (!checkAdminPermission(role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { page, limit } = getPaginationParams(req);
    const filters = getFilters(req);

    const result = await ticketService.getTickets(userId, role, page, limit, filters);

    logger.info('Admin tickets retrieved successfully', {
      controller: 'admin',
      method: 'getAllTickets',
      userId: userId,
      filtersApplied: Object.keys(filters),
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Tickets retrieved successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error in getAllTickets Controller', {
      controller: 'admin',
      method: 'getAllTickets',
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
const getTicketById = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId, role } = getUserInfo(req);
    
    if (!checkAdminPermission(role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { id: ticketId } = req.params;

    const ticket = await ticketService.getTicketById(ticketId, userId, role);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    logger.info('Admin ticket retrieved successfully', {
      controller: 'admin',
      method: 'getTicketById',
      userId: userId,
      ticketId: ticketId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Ticket retrieved successfully',
      data: ticket
    });

  } catch (error) {
    logger.error('Error in getTicketById Controller', {
      controller: 'admin',
      method: 'getTicketById',
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

const updateTicket = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId, role } = getUserInfo(req);
    
    if (!checkAdminPermission(role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { id: ticketId } = req.params;
    const updateData = req.body;

    const result = await db.transaction(async (transaction) => {
      const updatedTicket = await ticketService.updateTicket(
        ticketId,
        userId,
        role,
        updateData,
        transaction
      );

      return updatedTicket;
    });

    logger.info('Admin ticket updated successfully', {
      controller: 'admin',
      method: 'updateTicket',
      userId: userId,
      ticketId: ticketId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Ticket updated successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error in updateTicket Controller', {
      controller: 'admin',
      method: 'updateTicket',
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
const deleteTicket = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId, role } = getUserInfo(req);
    
    if (!checkAdminPermission(role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { id: ticketId } = req.params;

    await db.transaction(async (transaction) => {
      await ticketService.deleteTicket(ticketId, userId, role, transaction);
      return true;
    });

    logger.info('Admin ticket deleted successfully', {
      controller: 'admin',
      method: 'deleteTicket',
      userId: userId,
      ticketId: ticketId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Ticket deleted successfully'
    });

  } catch (error) {
    logger.error('Error in deleteTicket Controller', {
      controller: 'admin',
      method: 'deleteTicket',
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

const bulkDeleteTickets = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId, role } = getUserInfo(req);
    
    if (!checkAdminPermission(role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { ticketIds } = req.body;

    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ticket IDs provided'
      });
    }

    const result = await db.transaction(async (transaction) => {
      const deletedTickets = await ticketService.bulkDeleteTickets(
        ticketIds,
        role,
        transaction
      );

      return deletedTickets;
    });

    logger.info('Admin bulk delete tickets successful', {
      controller: 'admin',
      method: 'bulkDeleteTickets',
      userId: userId,
      deletedCount: result.length,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: `${result.length} tickets deleted successfully`,
      data: {
        deletedCount: result.length
      }
    });

  } catch (error) {
    logger.error('Error in bulkDeleteTickets Controller', {
      controller: 'admin',
      method: 'bulkDeleteTickets',
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
const assignTicket = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId, role } = getUserInfo(req);
    
    if (!checkAdminPermission(role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { id: ticketId } = req.params;
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: 'Agent ID is required'
      });
    }

    const result = await db.transaction(async (transaction) => {
      const updatedTicket = await ticketService.assignTicket(
        ticketId,
        userId,
        role,
        agentId,
        transaction
      );

      return updatedTicket;
    });

    logger.info('Admin ticket assigned successfully', {
      controller: 'admin',
      method: 'assignTicket',
      userId: userId,
      ticketId: ticketId,
      agentId: agentId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Ticket assigned successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error in assignTicket Controller', {
      controller: 'admin',
      method: 'assignTicket',
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

const getAllUsers = async (req, res) => {
  const requestId = req.id;

  try {
    const { role } = getUserInfo(req);
    
    if (!checkAdminPermission(role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { page, limit } = getPaginationParams(req);
    const filters = getFilters(req);

    const result = await userService.getAllUsers(page, limit, filters);

    logger.info('Admin users retrieved successfully', {
      controller: 'admin',
      method: 'getAllUsers',
      filtersApplied: Object.keys(filters),
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error in getAllUsers Controller', {
      controller: 'admin',
      method: 'getAllUsers',
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

const createUser = async (req, res) => {
  const requestId = req.id;

  try {
    const { role } = getUserInfo(req);
    
    if (!checkAdminPermission(role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { email, password, full_name, role: userRole } = req.body;

    // Validate required fields
    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and full name are required'
      });
    }

    // Check if user already exists
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create the user
    const userData = {
      email,
      password,
      full_name,
      role: userRole || 'user',
      email_verified: true  // Admin-created users are auto-verified
    };

    const newUser = await userService.createUser(userData);
    const safeUser = sanitizeUserResponse(newUser);

    logger.info('User created successfully by admin', {
      controller: 'admin',
      method: 'createUser',
      newUserId: newUser.id,
      email: email,
      requestId: requestId,
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: safeUser
    });

  } catch (error) {
    logger.error('Error in createUser Controller', {
      controller: 'admin',
      method: 'createUser',
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

const getUserById = async (req, res) => {
  const requestId = req.id;

  try {
    const { role } = getUserInfo(req);
    
    if (!checkAdminPermission(role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { id: targetUserId } = req.params;

    const user = await userService.getUserById(targetUserId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const safeUser = sanitizeUserResponse(user);

    logger.info('Admin user retrieved successfully', {
      controller: 'admin',
      method: 'getUserById',
      targetUserId: targetUserId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: safeUser
    });

  } catch (error) {
    logger.error('Error in getUserById Controller', {
      controller: 'admin',
      method: 'getUserById',
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

const updateUser = async (req, res) => {
  const requestId = req.id;

  try {
    const { role } = getUserInfo(req);
    
    if (!checkAdminPermission(role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { id: targetUserId } = req.params;
    const updateData = req.body;

    const existingUser = await userService.getUserById(targetUserId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const result = await db.transaction(async (transaction) => {
      const updatedUser = await userService.updateUser(targetUserId, updateData, transaction);
      return updatedUser;
    });

    const safeUser = sanitizeUserResponse(result);

    logger.info('Admin user updated successfully', {
      controller: 'admin',
      method: 'updateUser',
      targetUserId: targetUserId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: safeUser
    });

  } catch (error) {
    logger.error('Error in updateUser Controller', {
      controller: 'admin',
      method: 'updateUser',
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
const updateUserRole = async (req, res) => {
  const requestId = req.id;

  try {
    const { role } = getUserInfo(req);
    
    if (!checkAdminPermission(role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { id: targetUserId } = req.params;
    const { role: newRole } = req.body;

    if (!newRole) {
      return res.status(400).json({
        success: false,
        message: 'Role is required'
      });
    }

    const result = await db.transaction(async (transaction) => {
      const updatedUser = await userService.updateUserRole(targetUserId, newRole, transaction);
      return updatedUser;
    });

    const safeUser = sanitizeUserResponse(result);

    logger.info('Admin user role updated successfully', {
      controller: 'admin',
      method: 'updateUserRole',
      targetUserId: targetUserId,
      newRole: newRole,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: safeUser
    });

  } catch (error) {
    logger.error('Error in updateUserRole Controller', {
      controller: 'admin',
      method: 'updateUserRole',
      error: error.message,
      stack: error.stack,
      requestId: requestId,
    });

    if (error.message === 'Invalid role' || error.message === 'User not found') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId: currentUserId, role } = getUserInfo(req);
    
    if (!checkAdminPermission(role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { id: targetUserId } = req.params;

    const permission = userService.canDeleteUser(currentUserId, role, targetUserId);
    if (!permission.allowed) {
      return res.status(400).json({
        success: false,
        message: permission.reason
      });
    }

    const existingUser = await userService.getUserById(targetUserId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await db.transaction(async (transaction) => {
      await userService.deleteUser(targetUserId, transaction);
      return true;
    });

    logger.info('Admin user deleted successfully', {
      controller: 'admin',
      method: 'deleteUser',
      currentUserId: currentUserId,
      targetUserId: targetUserId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    logger.error('Error in deleteUser Controller', {
      controller: 'admin',
      method: 'deleteUser',
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
const verifyUserEmail = async (req, res) => {
  const requestId = req.id;

  try {
    const { role } = getUserInfo(req);
    
    if (!checkAdminPermission(role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { id: targetUserId } = req.params;

    const result = await db.transaction(async (transaction) => {
      const updatedUser = await userService.verifyUserEmail(targetUserId, transaction);
      return updatedUser;
    });

    const safeUser = sanitizeUserResponse(result);

    logger.info('Admin user email verified successfully', {
      controller: 'admin',
      method: 'verifyUserEmail',
      targetUserId: targetUserId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'User email verified successfully',
      data: safeUser
    });

  } catch (error) {
    logger.error('Error in verifyUserEmail Controller', {
      controller: 'admin',
      method: 'verifyUserEmail',
      error: error.message,
      stack: error.stack,
      requestId: requestId,
    });

    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getDashboardStats = async (req, res) => {
  const requestId = req.id;

  try {
    const { role } = getUserInfo(req);
    
    if (!checkAdminPermission(role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Use optimized queries with proper indexes
    const [basicStatsResult, categoryStatsResult, userStatsResult] = await Promise.all([
      // Basic ticket counts with single query
      safeQuery(`
        SELECT 
          COUNT(*) as total_tickets,
          COUNT(*) FILTER (WHERE status = 'UNTOUCHED') as untouched_tickets,
          COUNT(*) FILTER (WHERE status = 'PENDING') as pending_tickets,
          COUNT(*) FILTER (WHERE status = 'OPENED') as opened_tickets,
          COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress_tickets,
          COUNT(*) FILTER (WHERE status = 'SOLVED') as solved_tickets,
          COUNT(*) FILTER (WHERE status = 'CLOSED') as closed_tickets,
          COUNT(*) FILTER (WHERE priority = 'HIGH') as high_priority,
          COUNT(*) FILTER (WHERE priority = 'URGENT') as urgent_priority,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as tickets_today,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as tickets_this_week
        FROM tickets
      `),
      
      // Category breakdown
      safeQuery(`
        SELECT c.name as category_name, COUNT(t.id) as ticket_count
        FROM categories c
        LEFT JOIN tickets t ON c.id = t.category_id
        GROUP BY c.id, c.name
        ORDER BY ticket_count DESC
        LIMIT 10
      `),
      
      // User stats
      safeQuery(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
          COUNT(*) FILTER (WHERE role = 'agent') as agent_count,
          COUNT(*) FILTER (WHERE role = 'user') as user_count,
          COUNT(*) FILTER (WHERE last_login >= NOW() - INTERVAL '7 days') as active_users_week
        FROM users
      `)
    ]);

    const stats = {
      tickets: basicStatsResult.rows[0],
      ticketsByCategory: categoryStatsResult.rows,
      users: userStatsResult.rows[0]
    };

    // Convert string counts to integers
    Object.keys(stats.tickets).forEach(key => {
      if (stats.tickets[key] !== null) {
        stats.tickets[key] = parseInt(stats.tickets[key]) || 0;
      }
    });

    Object.keys(stats.users).forEach(key => {
      if (stats.users[key] !== null) {
        stats.users[key] = parseInt(stats.users[key]) || 0;
      }
    });

    logger.info('Admin dashboard stats retrieved successfully', {
      controller: 'admin',
      method: 'getDashboardStats',
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: stats
    });

  } catch (error) {
    logger.error('Error in getDashboardStats Controller', {
      controller: 'admin',
      method: 'getDashboardStats',
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
const getDashboardActivity = async (req, res) => {
  const requestId = req.id;

  try {
    const { role } = getUserInfo(req);
    
    if (!checkAdminPermission(role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 7;

    const [recentTickets, activeUsers] = await Promise.allSettled([
      ticketService.getRecentTickets(limit),
      userService.getUsersWithRecentActivity(days)
    ]);

    const activity = {
      recentTickets: recentTickets.status === 'fulfilled' ? recentTickets.value : [],
      activeUsers: activeUsers.status === 'fulfilled' ? activeUsers.value : []
    };

    logger.info('Admin dashboard activity retrieved successfully', {
      controller: 'admin',
      method: 'getDashboardActivity',
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Dashboard activity retrieved successfully',
      data: activity
    });

  } catch (error) {
    logger.error('Error in getDashboardActivity Controller', {
      controller: 'admin',
      method: 'getDashboardActivity',
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

const getSystemHealth = async (req, res) => {
  const requestId = req.id;

  try {
    const { role } = getUserInfo(req);
    
    if (!checkAdminPermission(role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const system = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    };

    logger.info('Admin system health retrieved successfully', {
      controller: 'admin',
      method: 'getSystemHealth',
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'System health retrieved successfully',
      data: system
    });

  } catch (error) {
    logger.error('Error in getSystemHealth Controller', {
      controller: 'admin',
      method: 'getSystemHealth',
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

// Categories CRUD
const getCategories = async (req, res) => {
  const requestId = req.id;
  try {
    const { role } = getUserInfo(req);
    if (!checkAdminPermission(role)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const result = await safeQuery('SELECT * FROM categories ORDER BY name ASC');
    return res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    logger.error('Error in getCategories Controller', {
      controller: 'admin',
      method: 'getCategories',
      error: error.message,
      requestId,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createCategory = async (req, res) => {
  const requestId = req.id;
  try {
    const { role } = getUserInfo(req);
    if (!checkAdminPermission(role)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const { name, description, color } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const result = await safeQuery(
      'INSERT INTO categories (name, description, color) VALUES ($1, $2, $3) RETURNING *',
      [name, description || null, color || '#3B82F6']
    );
    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error in createCategory Controller', {
      controller: 'admin',
      method: 'createCategory',
      error: error.message,
      requestId,
    });
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateCategory = async (req, res) => {
  const requestId = req.id;
  try {
    const { role } = getUserInfo(req);
    if (!checkAdminPermission(role)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const { id, name, description, color } = req.body;
    if (!id || !name) {
      return res.status(400).json({ success: false, message: 'ID and Name are required' });
    }
    const result = await safeQuery(
      'UPDATE categories SET name = $1, description = $2, color = $3 WHERE id = $4 RETURNING *',
      [name, description || null, color || '#3B82F6', id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error in updateCategory Controller', {
      controller: 'admin',
      method: 'updateCategory',
      error: error.message,
      requestId,
    });
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  const requestId = req.id;
  try {
    const { role } = getUserInfo(req);
    if (!checkAdminPermission(role)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const id = req.query.id || req.body.id || req.params.id;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Category ID is required' });
    }
    const result = await safeQuery('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error in deleteCategory Controller', {
      controller: 'admin',
      method: 'deleteCategory',
      error: error.message,
      requestId,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
};

const seedCategories = async (req, res) => {
  const requestId = req.id;
  try {
    const { role } = getUserInfo(req);
    if (!checkAdminPermission(role)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    const defaultCategories = [
      { name: 'Bug Report', description: 'Technical software bugs and issues', color: '#EF4444' },
      { name: 'Technical Issue', description: 'System down, failures, or errors', color: '#F59E0B' },
      { name: 'Account Inquiry', description: 'Authentication and profile questions', color: '#3B82F6' },
      { name: 'New Feature Request', description: 'Suggestions and improvements', color: '#10B981' },
      { name: 'Other', description: 'General questions', color: '#6B7280' }
    ];

    for (const cat of defaultCategories) {
      await safeQuery(
        'INSERT INTO categories (name, description, color) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
        [cat.name, cat.description, cat.color]
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Default categories seeded successfully',
      data: { message: 'Categories seeded' }
    });
  } catch (error) {
    logger.error('Error in seedCategories Controller', {
      controller: 'admin',
      method: 'seedCategories',
      error: error.message,
      requestId,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Tags CRUD
const getTags = async (req, res) => {
  const requestId = req.id;
  try {
    const { role } = getUserInfo(req);
    if (!checkAdminPermission(role)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const result = await safeQuery('SELECT * FROM tags ORDER BY name ASC');
    return res.status(200).json({
      success: true,
      message: 'Tags retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    logger.error('Error in getTags Controller', {
      controller: 'admin',
      method: 'getTags',
      error: error.message,
      requestId,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createTag = async (req, res) => {
  const requestId = req.id;
  try {
    const { role } = getUserInfo(req);
    if (!checkAdminPermission(role)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const { name, color } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const result = await safeQuery(
      'INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING *',
      [name, color || '#6B7280']
    );
    return res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error in createTag Controller', {
      controller: 'admin',
      method: 'createTag',
      error: error.message,
      requestId,
    });
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'Tag already exists' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateTag = async (req, res) => {
  const requestId = req.id;
  try {
    const { role } = getUserInfo(req);
    if (!checkAdminPermission(role)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const { id, name, color } = req.body;
    if (!id || !name) {
      return res.status(400).json({ success: false, message: 'ID and Name are required' });
    }
    const result = await safeQuery(
      'UPDATE tags SET name = $1, color = $2 WHERE id = $3 RETURNING *',
      [name, color || '#6B7280', id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Tag not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Tag updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error in updateTag Controller', {
      controller: 'admin',
      method: 'updateTag',
      error: error.message,
      requestId,
    });
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'Tag already exists' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTag = async (req, res) => {
  const requestId = req.id;
  try {
    const { role } = getUserInfo(req);
    if (!checkAdminPermission(role)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const id = req.query.id || req.body.id || req.params.id;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Tag ID is required' });
    }
    const result = await safeQuery('DELETE FROM tags WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Tag not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Tag deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error in deleteTag Controller', {
      controller: 'admin',
      method: 'deleteTag',
      error: error.message,
      requestId,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Custom statuses CRUD
const getCustomStatuses = async (req, res) => {
  const requestId = req.id;
  try {
    const { role } = getUserInfo(req);
    if (!checkAdminPermission(role)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const result = await safeQuery('SELECT * FROM custom_statuses ORDER BY name ASC');
    return res.status(200).json({
      success: true,
      message: 'Custom statuses retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    logger.error('Error in getCustomStatuses Controller', {
      controller: 'admin',
      method: 'getCustomStatuses',
      error: error.message,
      requestId,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createCustomStatus = async (req, res) => {
  const requestId = req.id;
  try {
    const { role } = getUserInfo(req);
    if (!checkAdminPermission(role)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const { name, color } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const result = await safeQuery(
      'INSERT INTO custom_statuses (name, color) VALUES ($1, $2) RETURNING *',
      [name, color || '#6B7280']
    );
    return res.status(201).json({
      success: true,
      message: 'Custom status created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error in createCustomStatus Controller', {
      controller: 'admin',
      method: 'createCustomStatus',
      error: error.message,
      requestId,
    });
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'Custom status already exists' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateCustomStatus = async (req, res) => {
  const requestId = req.id;
  try {
    const { role } = getUserInfo(req);
    if (!checkAdminPermission(role)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const { id, name, color } = req.body;
    if (!id || !name) {
      return res.status(400).json({ success: false, message: 'ID and Name are required' });
    }
    const result = await safeQuery(
      'UPDATE custom_statuses SET name = $1, color = $2 WHERE id = $3 RETURNING *',
      [name, color || '#6B7280', id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Custom status not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Custom status updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error in updateCustomStatus Controller', {
      controller: 'admin',
      method: 'updateCustomStatus',
      error: error.message,
      requestId,
    });
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'Custom status already exists' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCustomStatus = async (req, res) => {
  const requestId = req.id;
  try {
    const { role } = getUserInfo(req);
    if (!checkAdminPermission(role)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const id = req.query.id || req.body.id || req.params.id;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Custom status ID is required' });
    }
    const result = await safeQuery('DELETE FROM custom_statuses WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Custom status not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Custom status deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error in deleteCustomStatus Controller', {
      controller: 'admin',
      method: 'deleteCustomStatus',
      error: error.message,
      requestId,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Ticket types CRUD
const getTicketTypes = async (req, res) => {
  const requestId = req.id;
  try {
    const { role } = getUserInfo(req);
    if (!checkAdminPermission(role)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const result = await safeQuery('SELECT * FROM ticket_types ORDER BY name ASC');
    return res.status(200).json({
      success: true,
      message: 'Ticket types retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    logger.error('Error in getTicketTypes Controller', {
      controller: 'admin',
      method: 'getTicketTypes',
      error: error.message,
      requestId,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// COMMENT MANAGEMENT
// ============================================

const getTicketComments = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId, role } = getUserInfo(req);
    
    if (!checkAdminPermission(role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { id: ticketId } = req.params;

    const comments = await commentService.getTicketComments(ticketId, userId, role);

    logger.info('Admin ticket comments retrieved successfully', {
      controller: 'admin',
      method: 'getTicketComments',
      userId: userId,
      ticketId: ticketId,
      commentsCount: comments.length,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Comments retrieved successfully',
      data: { comments }
    });

  } catch (error) {
    logger.error('Error in getTicketComments Controller', {
      controller: 'admin',
      method: 'getTicketComments',
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

const addTicketComment = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId, role } = getUserInfo(req);
    
    if (!checkAdminPermission(role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { id: ticketId } = req.params;
    const { content, isInternal = false } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const comment = await commentService.addTicketComment(
      ticketId,
      userId,
      role,
      content.trim(),
      isInternal
    );

    logger.info('Admin ticket comment added successfully', {
      controller: 'admin',
      method: 'addTicketComment',
      userId: userId,
      ticketId: ticketId,
      commentId: comment.id,
      isInternal: isInternal,
      requestId: requestId,
    });

    return res.status(201).json({
      success: true,
      message: 'Comment posted successfully',
      data: { comment }
    });

  } catch (error) {
    logger.error('Error in addTicketComment Controller', {
      controller: 'admin',
      method: 'addTicketComment',
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

const deleteComment = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId, role } = getUserInfo(req);
    
    if (!checkAdminPermission(role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { id: commentId } = req.params;

    await commentService.deleteComment(commentId, userId, role);

    logger.info('Admin comment deleted successfully', {
      controller: 'admin',
      method: 'deleteComment',
      userId: userId,
      commentId: commentId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    logger.error('Error in deleteComment Controller', {
      controller: 'admin',
      method: 'deleteComment',
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

// Attachments management
const getTicketAttachments = async (req, res) => {
  const requestId = req.id;
  try {
    const { userId, role } = getUserInfo(req);
    if (!checkAdminPermission(role)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const ticketId = req.params.id;
    
    const result = await safeQuery(
      'SELECT * FROM attachments WHERE ticket_id = $1 ORDER BY created_at DESC',
      [ticketId]
    );
    
    return res.status(200).json({
      success: true,
      message: 'Attachments retrieved successfully',
      data: { attachments: result.rows }
    });
  } catch (error) {
    logger.error('Error in getTicketAttachments Controller', {
      controller: 'admin',
      method: 'getTicketAttachments',
      error: error.message,
      requestId,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
};

export {
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  bulkDeleteTickets,
  assignTicket,
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  updateUserRole,
  deleteUser,
  verifyUserEmail,
  getDashboardStats,
  getDashboardActivity,
  getSystemHealth,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  seedCategories,
  getTags,
  createTag,
  updateTag,
  deleteTag,
  getCustomStatuses,
  createCustomStatus,
  updateCustomStatus,
  deleteCustomStatus,
  getTicketTypes,
  getTicketComments,
  addTicketComment,
  deleteComment,
  getTicketAttachments,
};