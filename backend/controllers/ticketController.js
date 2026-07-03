import { ticketService } from '../services/ticketService.js';
import { commentService } from '../services/commentService.js';
import db from '../lib/database.js';
import { logger } from '../middleware/logging.js';
import { 
  getUserInfo, 
  getPaginationParams, 
  getFilters, 
  validateTicketData 
} from '../utils/helpers.js';

const getTickets = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId, role } = getUserInfo(req);
    const { page, limit } = getPaginationParams(req);
    const filters = getFilters(req);

    const result = await ticketService.getTickets(userId, role, page, limit, filters);

    logger.info('Tickets retrieved successfully', {
      controller: 'ticket',
      method: 'getTickets',
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
    logger.error('Error in getTickets Controller', {
      controller: 'ticket',
      method: 'getTickets',
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
const searchTickets = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId, role } = getUserInfo(req);
    const { page, limit } = getPaginationParams(req);
    const { q: searchTerm } = req.query;

    if (!searchTerm || searchTerm.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }

    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.priority) filters.priority = req.query.priority;

    const result = await ticketService.searchTickets(searchTerm, userId, role, filters, page, limit);

    logger.info('Tickets searched successfully', {
      controller: 'ticket',
      method: 'searchTickets',
      userId: userId,
      searchTerm: searchTerm,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Tickets searched successfully',
      data: {
        searchTerm,
        ...result
      }
    });

  } catch (error) {
    logger.error('Error in searchTickets Controller', {
      controller: 'ticket',
      method: 'searchTickets',
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

const getTicketAnalytics = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId, role } = getUserInfo(req);

    // Verify agent/admin access
    if (role !== 'admin' && role !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Agent or admin access required'
      });
    }

    const [analytics, ticketsByCategory, ticketsByAgent] = await Promise.allSettled([
      ticketService.getTicketAnalytics(),
      ticketService.getTicketsByCategory(),
      ticketService.getTicketsByAgent()
    ]);

    const analyticsData = {
      overview: analytics.status === 'fulfilled' ? analytics.value : null,
      byCategory: ticketsByCategory.status === 'fulfilled' ? ticketsByCategory.value : [],
      byAgent: ticketsByAgent.status === 'fulfilled' ? ticketsByAgent.value : []
    };

    logger.info('Ticket analytics retrieved successfully', {
      controller: 'ticket',
      method: 'getTicketAnalytics',
      userId: userId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Ticket analytics retrieved successfully',
      data: analyticsData
    });

  } catch (error) {
    logger.error('Error in getTicketAnalytics Controller', {
      controller: 'ticket',
      method: 'getTicketAnalytics',
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
const getRecentTickets = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId, role } = getUserInfo(req);

    // Verify agent/admin access
    if (role !== 'admin' && role !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Agent or admin access required'
      });
    }

    const limit = parseInt(req.query.limit) || 10;
    const tickets = await ticketService.getRecentTickets(limit);

    logger.info('Recent tickets retrieved successfully', {
      controller: 'ticket',
      method: 'getRecentTickets',
      userId: userId,
      limit: limit,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Recent tickets retrieved successfully',
      data: tickets
    });

  } catch (error) {
    logger.error('Error in getRecentTickets Controller', {
      controller: 'ticket',
      method: 'getRecentTickets',
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

const getMyTickets = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId, role } = getUserInfo(req);
    const { page, limit } = getPaginationParams(req);
    const filters = {};

    if (req.query.status) filters.status = req.query.status;
    if (req.query.priority) filters.priority = req.query.priority;
    if (req.query.category_id) filters.category_id = req.query.category_id;

    const result = await ticketService.getUserTickets(userId, userId, role, page, limit, filters);

    logger.info('User tickets retrieved successfully', {
      controller: 'ticket',
      method: 'getMyTickets',
      userId: userId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Your tickets retrieved successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error in getMyTickets Controller', {
      controller: 'ticket',
      method: 'getMyTickets',
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
const getAssignedTickets = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId, role } = getUserInfo(req);
    const { page, limit } = getPaginationParams(req);

    // Verify agent/admin access
    if (role !== 'admin' && role !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Agent or admin access required'
      });
    }

    const result = await ticketService.getTicketsAssignedTo(userId, userId, role, page, limit);

    logger.info('Assigned tickets retrieved successfully', {
      controller: 'ticket',
      method: 'getAssignedTickets',
      userId: userId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Assigned tickets retrieved successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error in getAssignedTickets Controller', {
      controller: 'ticket',
      method: 'getAssignedTickets',
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
    const { id: ticketId } = req.params;

    const ticket = await ticketService.getTicketById(ticketId, userId, role);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    logger.info('Ticket retrieved successfully', {
      controller: 'ticket',
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
      controller: 'ticket',
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
const createTicket = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId } = getUserInfo(req);
    const ticketData = req.body;

    // Validate input
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

const updateTicket = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId, role } = getUserInfo(req);
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

    logger.info('Ticket updated successfully', {
      controller: 'ticket',
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
      controller: 'ticket',
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
    const { id: ticketId } = req.params;

    await db.transaction(async (transaction) => {
      await ticketService.deleteTicket(ticketId, userId, role, transaction);
      return true;
    });

    logger.info('Ticket deleted successfully', {
      controller: 'ticket',
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
      controller: 'ticket',
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

const assignTicket = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId, role } = getUserInfo(req);
    const { id: ticketId } = req.params;
    const { agentId } = req.body;

    // Verify agent/admin access
    if (role !== 'admin' && role !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Agent or admin access required'
      });
    }

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

    logger.info('Ticket assigned successfully', {
      controller: 'ticket',
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
      controller: 'ticket',
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

const getTicketComments = async (req, res) => {
  const requestId = req.id;
  try {
    const { userId, role } = getUserInfo(req);
    const ticketId = req.params.id;
    const comments = await commentService.getTicketComments(ticketId, userId, role);
    return res.status(200).json({
      success: true,
      message: 'Comments retrieved successfully',
      data: { comments }
    });
  } catch (error) {
    logger.error('Error in getTicketComments Controller', {
      controller: 'ticket',
      method: 'getTicketComments',
      error: error.message,
      requestId,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addTicketComment = async (req, res) => {
  const requestId = req.id;
  try {
    const { userId, role } = getUserInfo(req);
    const ticketId = req.params.id;
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const comment = await commentService.addTicketComment(ticketId, userId, role, content, false);
    return res.status(201).json({
      success: true,
      message: 'Comment posted successfully',
      data: { comment }
    });
  } catch (error) {
    logger.error('Error in addTicketComment Controller', {
      controller: 'ticket',
      method: 'addTicketComment',
      error: error.message,
      requestId,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
};

export {
  getTickets,
  searchTickets,
  getTicketAnalytics,
  getRecentTickets,
  getMyTickets,
  getAssignedTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  assignTicket,
  getTicketComments,
  addTicketComment,
};