import { solutionService  } from '../services/solutionService.js';
import db from '../lib/database.js';
import { logger  } from '../middleware/logging.js';
import { getUserInfo, 
  getPaginationParams, 
  getFilters, 
  validateSolutionInput 
 } from '../utils/helpers.js';

const getSolutions = async (req, res) => {
  const requestId = req.id;

  try {
    const publishedOnly = true; // Public endpoint only shows published
    const { page, limit } = getPaginationParams(req);
    const filters = getFilters(req);

    const result = await solutionService.getSolutions(publishedOnly, page, limit, filters);

    logger.info('Solutions retrieved successfully', {
      controller: 'solution',
      method: 'getSolutions',
      publishedOnly: publishedOnly,
      page: page,
      limit: limit,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Solutions retrieved successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error in getSolutions Controller', {
      controller: 'solution',
      method: 'getSolutions',
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

const getAllSolutions = async (req, res) => {
  const requestId = req.id;

  try {
    const { role } = getUserInfo(req);
    
    // Admin endpoint - includes unpublished solutions
    if (role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const publishedOnly = false;
    const { page, limit } = getPaginationParams(req);
    const filters = getFilters(req);

    const result = await solutionService.getSolutions(publishedOnly, page, limit, filters);

    logger.info('All solutions retrieved successfully', {
      controller: 'solution',
      method: 'getAllSolutions',
      role: role,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'All solutions retrieved successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error in getAllSolutions Controller', {
      controller: 'solution',
      method: 'getAllSolutions',
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

const getSolutionById = async (req, res) => {
  const requestId = req.id;

  try {
    const { id: solutionId } = req.params;

    const solution = await solutionService.getSolutionById(solutionId);

    if (!solution || !solution.is_published) {
      return res.status(404).json({
        success: false,
        message: 'Solution not found'
      });
    }

    // Increment view count
    await solutionService.incrementViews(solutionId);

    logger.info('Solution retrieved successfully', {
      controller: 'solution',
      method: 'getSolutionById',
      solutionId: solutionId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Solution retrieved successfully',
      data: solution
    });

  } catch (error) {
    logger.error('Error in getSolutionById Controller', {
      controller: 'solution',
      method: 'getSolutionById',
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

const createSolution = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId, role } = getUserInfo(req);
    const solutionData = req.body;

    // Validate input
    const validationErrors = validateSolutionInput(
      solutionData.title,
      solutionData.description,
      solutionData.steps
    );
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Only admins can publish solutions directly
    if (solutionData.is_published && role !== 'admin') {
      solutionData.is_published = false;
    }

    const result = await db.transaction(async (transaction) => {
      const solution = await solutionService.createSolution(userId, solutionData, transaction);
      return solution;
    });

    logger.info('Solution created successfully', {
      controller: 'solution',
      method: 'createSolution',
      userId: userId,
      solutionId: result.id,
      requestId: requestId,
    });

    return res.status(201).json({
      success: true,
      message: 'Solution created successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error in createSolution Controller', {
      controller: 'solution',
      method: 'createSolution',
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

const updateSolution = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId, role } = getUserInfo(req);
    const { id: solutionId, ...updateData } = req.body;

    if (!solutionId) {
      return res.status(400).json({
        success: false,
        message: 'Solution ID is required'
      });
    }

    // Check if solution exists
    const existingSolution = await solutionService.getSolutionById(solutionId);
    if (!existingSolution) {
      return res.status(404).json({
        success: false,
        message: 'Solution not found'
      });
    }

    // Only admin or creator can update
    if (role !== 'admin' && existingSolution.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this solution'
      });
    }

    // Validate input if provided
    if (updateData.title || updateData.description || updateData.steps) {
      const validationErrors = validateSolutionInput(
        updateData.title || existingSolution.title,
        updateData.description || existingSolution.description,
        updateData.steps || existingSolution.steps
      );
      
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }
    }

    const result = await solutionService.updateSolution(solutionId, updateData);

    logger.info('Solution updated successfully', {
      controller: 'solution',
      method: 'updateSolution',
      userId: userId,
      solutionId: solutionId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Solution updated successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error in updateSolution Controller', {
      controller: 'solution',
      method: 'updateSolution',
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

const deleteSolution = async (req, res) => {
  const requestId = req.id;

  try {
    const { userId, role } = getUserInfo(req);
    const { id: solutionId } = req.query;

    if (!solutionId) {
      return res.status(400).json({
        success: false,
        message: 'Solution ID is required'
      });
    }

    // Check if solution exists
    const existingSolution = await solutionService.getSolutionById(solutionId);
    if (!existingSolution) {
      return res.status(404).json({
        success: false,
        message: 'Solution not found'
      });
    }

    // Only admin or creator can delete
    if (role !== 'admin' && existingSolution.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this solution'
      });
    }

    await solutionService.deleteSolution(solutionId);

    logger.info('Solution deleted successfully', {
      controller: 'solution',
      method: 'deleteSolution',
      userId: userId,
      solutionId: solutionId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Solution deleted successfully'
    });

  } catch (error) {
    logger.error('Error in deleteSolution Controller', {
      controller: 'solution',
      method: 'deleteSolution',
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

const markSolutionHelpful = async (req, res) => {
  const requestId = req.id;

  try {
    const { id: solutionId } = req.params;

    const solution = await solutionService.getSolutionById(solutionId);
    
    if (!solution || !solution.is_published) {
      return res.status(404).json({
        success: false,
        message: 'Solution not found'
      });
    }

    await solutionService.incrementHelpful(solutionId);

    logger.info('Solution marked as helpful', {
      controller: 'solution',
      method: 'markSolutionHelpful',
      solutionId: solutionId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Solution marked as helpful'
    });

  } catch (error) {
    logger.error('Error in markSolutionHelpful Controller', {
      controller: 'solution',
      method: 'markSolutionHelpful',
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

const searchSolutions = async (req, res) => {
  const requestId = req.id;

  try {
    const { query: searchTerm } = req.params;
    const { page, limit } = getPaginationParams(req);
    
    if (!searchTerm || searchTerm.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }

    const result = await solutionService.searchSolutionsByQuery(searchTerm, true, page, limit);

    logger.info('Solutions searched successfully', {
      controller: 'solution',
      method: 'searchSolutions',
      searchTerm: searchTerm,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Solutions searched successfully',
      data: {
        solutions: result.data,
        searchTerm,
        pagination: result.pagination
      }
    });

  } catch (error) {
    logger.error('Error in searchSolutions Controller', {
      controller: 'solution',
      method: 'searchSolutions',
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

const getSolutionsByCategory = async (req, res) => {
  const requestId = req.id;

  try {
    const { categoryId } = req.params;
    const { page, limit } = getPaginationParams(req);

    const result = await solutionService.getSolutionsByCategory(categoryId, page, limit);

    logger.info('Solutions by category retrieved successfully', {
      controller: 'solution',
      method: 'getSolutionsByCategory',
      categoryId: categoryId,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Solutions by category retrieved successfully',
      data: {
        solutions: result.data,
        categoryId,
        pagination: result.pagination
      }
    });

  } catch (error) {
    logger.error('Error in getSolutionsByCategory Controller', {
      controller: 'solution',
      method: 'getSolutionsByCategory',
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

const getSolutionsByTag = async (req, res) => {
  const requestId = req.id;

  try {
    const { tag } = req.params;
    const { page, limit } = getPaginationParams(req);

    const result = await solutionService.getSolutionsByTag(tag, page, limit);

    logger.info('Solutions by tag retrieved successfully', {
      controller: 'solution',
      method: 'getSolutionsByTag',
      tag: tag,
      requestId: requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'Solutions by tag retrieved successfully',
      data: {
        solutions: result.data,
        tag,
        pagination: result.pagination
      }
    });

  } catch (error) {
    logger.error('Error in getSolutionsByTag Controller', {
      controller: 'solution',
      method: 'getSolutionsByTag',
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
  getSolutions,
  getAllSolutions,
  getSolutionById,
  createSolution,
  updateSolution,
  deleteSolution,
  markSolutionHelpful,
  searchSolutions,
  getSolutionsByCategory,
  getSolutionsByTag,
};