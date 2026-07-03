import { safeQuery } from '../lib/database.js'

class SolutionService {
  // ============================================
  // SOLUTION CRUD OPERATIONS
  // ============================================

  async createSolution(userId, solutionData) {
    // Handle category - can be sent as 'category' or 'category_name'
    const categoryName = solutionData.category || solutionData.category_name || null;
    
    const result = await safeQuery(
      `INSERT INTO solutions (created_by, title, description, steps, category_id, category_name, tags, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        solutionData.title,
        solutionData.description,
        solutionData.steps,
        solutionData.category_id || null,
        categoryName,
        solutionData.tags || [],
        solutionData.is_published !== undefined ? solutionData.is_published : true  // Default to published
      ]
    )
    
    return result.rows[0];
  }

  async getSolutionById(solutionId) {
    const result = await safeQuery(
      `SELECT s.*, u.full_name as author_name, c.name as category_name
       FROM solutions s
       LEFT JOIN users u ON s.created_by = u.id
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE s.id = $1`,
      [solutionId]
    )
    return result.rows[0] || null
  }

  async getSolutions(publishedOnly = true, page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit
    const conditions = []
    const values = []
    let paramIndex = 1

    if (publishedOnly) {
      conditions.push(`s.is_published = $${paramIndex++}`)
      values.push(true)
    }

    if (filters.category_id) {
      conditions.push(`s.category_id = $${paramIndex++}`)
      values.push(filters.category_id)
    }

    if (filters.user_id) {
      conditions.push(`s.created_by = $${paramIndex++}`)
      values.push(filters.user_id)
    }

    if (filters.search) {
      conditions.push(`(s.title ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex})`)
      values.push(`%${filters.search}%`)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get total count
    const countResult = await safeQuery(
      `SELECT COUNT(*) as count FROM solutions s ${whereClause}`,
      values
    )
    const total = parseInt(countResult.rows[0].count)

    // Get solutions with author and category info
    const solutionsResult = await safeQuery(
      `SELECT s.*, u.full_name as author_name, c.name as category_name,
              (SELECT AVG(f.rating::decimal) FROM feedback f WHERE f.solution_id = s.id) as avg_rating,
              (SELECT COUNT(*) FROM feedback f WHERE f.solution_id = s.id) as rating_count
       FROM solutions s
       LEFT JOIN users u ON s.created_by = u.id
       LEFT JOIN categories c ON s.category_id = c.id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...values, limit, offset]
    )

    return {
      data: solutionsResult.rows.map(solution => ({
        ...solution,
        avg_rating: parseFloat(solution.avg_rating) || 0,
        rating_count: parseInt(solution.rating_count) || 0
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async updateSolution(solutionId, solutionData) {
    const fields = []
    const values = []
    let paramIndex = 1

    const allowedFields = ['title', 'description', 'steps', 'category_id', 'category_name', 'tags', 'is_published']
    
    // Map 'category' to 'category_name'  
    if (solutionData.category && !solutionData.category_name) {
      solutionData.category_name = solutionData.category;
    }
    
    allowedFields.forEach(field => {
      if (solutionData[field] !== undefined) {
        fields.push(`${field} = $${paramIndex++}`)
        values.push(solutionData[field])
      }
    })

    if (fields.length === 0) {
      return await this.getSolutionById(solutionId);
    }

    values.push(solutionId)

    const result = await safeQuery(
      `UPDATE solutions SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    )
    
    return result.rows[0];
  }

  async deleteSolution(solutionId) {
    const result = await safeQuery(
      'DELETE FROM solutions WHERE id = $1 RETURNING *',
      [solutionId]
    )
    return result.rows[0]
  }

  // ============================================
  // SOLUTION INTERACTIONS
  // ============================================

  async incrementViews(solutionId) {
    await safeQuery(
      'UPDATE solutions SET view_count = view_count + 1 WHERE id = $1',
      [solutionId]
    )
  }

  async incrementHelpful(solutionId) {
    await safeQuery(
      'UPDATE solutions SET helpful_count = helpful_count + 1 WHERE id = $1',
      [solutionId]
    )
  }

  // ============================================
  // SOLUTION QUERIES
  // ============================================

  async searchSolutions(searchTerm, publishedOnly = true, page = 1, limit = 20) {
    const filters = { search: searchTerm }
    return await this.getSolutions(publishedOnly, page, limit, filters)
  }

  async getSolutionsByCategory(categoryId, page = 1, limit = 20) {
    const filters = { category_id: categoryId }
    return await this.getSolutions(true, page, limit, filters)
  }

  async getSolutionsByTag(tag, page = 1, limit = 20) {
    const offset = (page - 1) * limit
    
    const countResult = await safeQuery(
      `SELECT COUNT(*) as count
       FROM solutions s
       WHERE s.is_published = true
         AND EXISTS (
           SELECT 1
           FROM tags tg
           WHERE tg.id = ANY(s.tags)
             AND (tg.id::text = $1 OR tg.name = $1)
         )`,
      [tag]
    )
    const total = parseInt(countResult.rows[0].count)

    const solutionsResult = await safeQuery(
      `SELECT s.*, u.full_name as author_name, c.name as category_name,
              (SELECT AVG(f.rating::decimal) FROM feedback f WHERE f.solution_id = s.id) as avg_rating,
              (SELECT COUNT(*) FROM feedback f WHERE f.solution_id = s.id) as rating_count
       FROM solutions s
       LEFT JOIN users u ON s.created_by = u.id
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE s.is_published = true
         AND EXISTS (
           SELECT 1
           FROM tags tg
           WHERE tg.id = ANY(s.tags)
             AND (tg.id::text = $1 OR tg.name = $1)
         )
       ORDER BY s.created_at DESC
       LIMIT $2 OFFSET $3`,
      [tag, limit, offset]
    )

    return {
      data: solutionsResult.rows.map(solution => ({
        ...solution,
        avg_rating: parseFloat(solution.avg_rating) || 0,
        rating_count: parseInt(solution.rating_count) || 0
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async getUserSolutions(userId, page = 1, limit = 20) {
    const filters = { user_id: userId }
    return await this.getSolutions(false, page, limit, filters) // Include unpublished for user's own solutions
  }

  async getPopularSolutions(limit = 10) {
    const result = await safeQuery(
      `SELECT s.*, u.full_name as author_name, c.name as category_name,
              (SELECT AVG(f.rating::decimal) FROM feedback f WHERE f.solution_id = s.id) as avg_rating,
              (SELECT COUNT(*) FROM feedback f WHERE f.solution_id = s.id) as rating_count
       FROM solutions s
       LEFT JOIN users u ON s.created_by = u.id
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE s.is_published = true
       ORDER BY s.view_count DESC, s.helpful_count DESC
       LIMIT $1`,
      [limit]
    )

    return result.rows.map(solution => ({
      ...solution,
      avg_rating: parseFloat(solution.avg_rating) || 0,
      rating_count: parseInt(solution.rating_count) || 0
    }))
  }

  async searchSolutionsByQuery(searchTerm, publishedOnly = true, page = 1, limit = 20) {
    const offset = (page - 1) * limit
    const searchPattern = `%${searchTerm}%`
    const publishedCondition = publishedOnly ? 's.is_published = true AND' : ''
    
    const countResult = await safeQuery(
      `SELECT COUNT(*) as count FROM solutions s
       WHERE ${publishedCondition} (
         s.title ILIKE $1
         OR s.description ILIKE $1
         OR s.steps ILIKE $1
         OR EXISTS (
           SELECT 1
           FROM tags tg
           WHERE tg.id = ANY(s.tags)
             AND tg.name ILIKE $1
         )
       )`,
      [searchPattern]
    )
    const total = parseInt(countResult.rows[0].count)

    const solutionsResult = await safeQuery(
      `SELECT s.*, u.full_name as author_name, c.name as category_name,
              (SELECT AVG(f.rating::decimal) FROM feedback f WHERE f.solution_id = s.id) as avg_rating,
              (SELECT COUNT(*) FROM feedback f WHERE f.solution_id = s.id) as rating_count
       FROM solutions s
       LEFT JOIN users u ON s.created_by = u.id
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE ${publishedCondition} (
         s.title ILIKE $1
         OR s.description ILIKE $1
         OR s.steps ILIKE $1
         OR EXISTS (
           SELECT 1
           FROM tags tg
           WHERE tg.id = ANY(s.tags)
             AND tg.name ILIKE $1
         )
       )
       ORDER BY s.created_at DESC
       LIMIT $2 OFFSET $3`,
      [searchPattern, limit, offset]
    )

    return {
      data: solutionsResult.rows.map(solution => ({
        ...solution,
        avg_rating: parseFloat(solution.avg_rating) || 0,
        rating_count: parseInt(solution.rating_count) || 0
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async getSolutionAnalytics() {
    const result = await safeQuery(`
      SELECT 
        COUNT(*) as total_solutions,
        COUNT(CASE WHEN is_published = true THEN 1 END) as published_solutions,
        COUNT(CASE WHEN is_published = false THEN 1 END) as draft_solutions,
        SUM(view_count) as total_views,
        SUM(helpful_count) as total_helpful,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as solutions_this_month
      FROM solutions
    `)

    return result.rows[0]
  }
}

export const solutionService = new SolutionService()
