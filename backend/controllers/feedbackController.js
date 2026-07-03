import { feedbackService  } from '../services/feedbackService.js';
import db from '../lib/database.js';
import { logger  } from '../middleware/logging.js';
import { getUserInfo, 
  validateFeedbackInput 
 } from '../utils/helpers.js';

const createFeedback = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId } = getUserInfo(req);
    const { ticket_id, solution_id, rating, comment } = req.body;

    // Validate input
    const validationErrors = validateFeedbackInput(ticket_id, solution_id, rating, comment);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    const result = await db.transaction(async (transaction) => {
      const feedback = await feedbackService.createFeedback(
        userId,
        ticket_id,
        solution_id,
        rating,
        comment,
        transaction
      );

      return feedback;
    });

    logger.info('Feedback created successfully', {
      controller: 'feedback',
      method: 'createFeedback',
      userId: userId,
      feedbackId: result.id,
      requestId: requestId,
    });

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        id: result.id,
        rating: result.rating,
        comment: result.comment,
        created_at: result.created_at
      }
    });

  } catch (error) {
    logger.error('Error in createFeedback Controller', {
      controller: 'feedback',
      method: 'createFeedback',
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

const getTicketFeedback = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId, role } = getUserInfo(req);
    const { ticketId } = req.params;

    const feedback = await feedbackService.getTicketFeedback(ticketId, userId, role);

    logger.info('Ticket feedback retrieved successfully', {
      controller: 'feedback',
      method: 'getTicketFeedback',
      userId: userId,
      ticketId: ticketId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Ticket feedback retrieved successfully',
      data: {
        feedback,
        ticketId
      }
    });

  } catch (error) {
    logger.error('Error in getTicketFeedback Controller', {
      controller: 'feedback',
      method: 'getTicketFeedback',
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

const getSolutionFeedback = async (req, res) => {
  const requestId = req.id;

  try {
    const { solutionId } = req.params;

    const result = await feedbackService.getSolutionFeedback(solutionId);

    logger.info('Solution feedback retrieved successfully', {
      controller: 'feedback',
      method: 'getSolutionFeedback',
      solutionId: solutionId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Solution feedback retrieved successfully',
      data: {
        ...result,
        solutionId
      }
    });

  } catch (error) {
    logger.error('Error in getSolutionFeedback Controller', {
      controller: 'feedback',
      method: 'getSolutionFeedback',
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

const getMyFeedback = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId } = getUserInfo(req);

    const feedback = await feedbackService.getMyFeedback(userId);

    logger.info('User feedback history retrieved successfully', {
      controller: 'feedback',
      method: 'getMyFeedback',
      userId: userId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Feedback history retrieved successfully',
      data: feedback
    });

  } catch (error) {
    logger.error('Error in getMyFeedback Controller', {
      controller: 'feedback',
      method: 'getMyFeedback',
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

const updateFeedback = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId } = getUserInfo(req);
    const { id: feedbackId } = req.params;
    const { rating, comment } = req.body;

    // Validate input
    const validationErrors = validateFeedbackInput(null, null, rating, comment, { partial: true });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    const result = await db.transaction(async (transaction) => {
      const feedback = await feedbackService.updateFeedback(
        feedbackId,
        userId,
        rating,
        comment,
        transaction
      );

      return feedback;
    });

    logger.info('Feedback updated successfully', {
      controller: 'feedback',
      method: 'updateFeedback',
      userId: userId,
      feedbackId: feedbackId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Feedback updated successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error in updateFeedback Controller', {
      controller: 'feedback',
      method: 'updateFeedback',
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

const deleteFeedback = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId, role } = getUserInfo(req);
    const { id: feedbackId } = req.params;

    await db.transaction(async (transaction) => {
      await feedbackService.deleteFeedback(feedbackId, userId, role, transaction);
      return true;
    });

    logger.info('Feedback deleted successfully', {
      controller: 'feedback',
      method: 'deleteFeedback',
      userId: userId,
      feedbackId: feedbackId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully'
    });

  } catch (error) {
    logger.error('Error in deleteFeedback Controller', {
      controller: 'feedback',
      method: 'deleteFeedback',
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

const getFeedbackOverview = async (req, res) => {
  const requestId = req.id;

  try {
    const { role } = getUserInfo(req);

    const stats = await feedbackService.getFeedbackOverview(role);

    logger.info('Feedback overview retrieved successfully', {
      controller: 'feedback',
      method: 'getFeedbackOverview',
      role: role,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Feedback overview retrieved successfully',
      data: stats
    });

  } catch (error) {
    logger.error('Error in getFeedbackOverview Controller', {
      controller: 'feedback',
      method: 'getFeedbackOverview',
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

export {
  createFeedback,
  getTicketFeedback,
  getSolutionFeedback,
  getMyFeedback,
  updateFeedback,
  deleteFeedback,
  getFeedbackOverview,
};
