import { safeQuery } from '../lib/database.js'

export class FeedbackService {
  // ============================================
  // FEEDBACK CRUD
  // ============================================

  async createFeedback(userId, ticketId, solutionId, rating, comment) {
    if (!rating || rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }
    if (!ticketId && !solutionId) {
      throw new Error('Either ticket_id or solution_id is required')
    }

    const result = await safeQuery(
      `INSERT INTO feedback (user_id, ticket_id, solution_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, ticketId || null, solutionId || null, rating, comment || null]
    )

    return result.rows[0]
  }

  async getTicketFeedback(ticketId, requesterUserId, _requesterRole) {
    if (!requesterUserId) {
      throw new Error('Authentication required')
    }

    const result = await safeQuery(
      `SELECT f.*, u.full_name as user_name
       FROM feedback f
       LEFT JOIN users u ON f.user_id = u.id
       WHERE f.ticket_id = $1
       ORDER BY f.created_at DESC`,
      [ticketId]
    )

    return result.rows
  }

  async getSolutionFeedback(solutionId) {
    const feedbackResult = await safeQuery(
      `SELECT f.*, u.full_name as user_name
       FROM feedback f
       LEFT JOIN users u ON f.user_id = u.id
       WHERE f.solution_id = $1 AND f.comment IS NOT NULL
       ORDER BY f.created_at DESC
       LIMIT 50`,
      [solutionId]
    )

    const ratingResult = await safeQuery(
      `SELECT AVG(rating::decimal) as avg_rating, COUNT(*) as total_count
       FROM feedback
       WHERE solution_id = $1`,
      [solutionId]
    )

    const stats = ratingResult.rows[0]

    return {
      feedback: feedbackResult.rows,
      stats: {
        averageRating: parseFloat(stats.avg_rating) || 0,
        totalRatings: parseInt(stats.total_count) || 0
      }
    }
  }

  async getMyFeedback(userId) {
    const result = await safeQuery(
      `SELECT f.*, 
              t.title as ticket_title,
              s.title as solution_title
       FROM feedback f
       LEFT JOIN tickets t ON f.ticket_id = t.id
       LEFT JOIN solutions s ON f.solution_id = s.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    )

    return result.rows
  }

  async updateFeedback(feedbackId, userId, rating, comment) {
    if (rating && (rating < 1 || rating > 5)) {
      throw new Error('Rating must be between 1 and 5')
    }

    const existingResult = await safeQuery(
      'SELECT * FROM feedback WHERE id = $1 AND user_id = $2',
      [feedbackId, userId]
    )

    if (existingResult.rows.length === 0) {
      throw new Error('Feedback not found or access denied')
    }

    const fields = []
    const values = []
    let paramIndex = 1

    if (rating !== undefined) {
      fields.push(`rating = $${paramIndex++}`)
      values.push(rating)
    }
    if (comment !== undefined) {
      fields.push(`comment = $${paramIndex++}`)
      values.push(comment)
    }

    if (fields.length === 0) {
      throw new Error('No fields to update')
    }

    values.push(feedbackId, userId)

    const result = await safeQuery(
      `UPDATE feedback 
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
       RETURNING *`,
      values
    )

    return result.rows[0]
  }

  async deleteFeedback(feedbackId, userId, _userRole) {
    const existingResult = await safeQuery(
      'SELECT * FROM feedback WHERE id = $1 AND user_id = $2',
      [feedbackId, userId]
    )

    if (existingResult.rows.length === 0) {
      throw new Error('Feedback not found or access denied')
    }

    await safeQuery(
      'DELETE FROM feedback WHERE id = $1 AND user_id = $2',
      [feedbackId, userId]
    )
  }

  // ============================================
  // FEEDBACK ANALYTICS
  // ============================================

  async getFeedbackOverview(userRole) {
    if (userRole !== 'admin') {
      throw new Error('Admin access required')
    }

    const result = await safeQuery(
      `SELECT 
         COUNT(*) as total_feedback,
         AVG(rating::decimal) as avg_rating,
         COUNT(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN 1 END) as feedback_this_month,
         (SELECT s.title FROM feedback f2 
          LEFT JOIN solutions s ON f2.solution_id = s.id 
          WHERE f2.solution_id IS NOT NULL 
          GROUP BY s.id, s.title 
          ORDER BY COUNT(*) DESC 
          LIMIT 1) as most_rated_solution
       FROM feedback`,
      []
    )

    const stats = result.rows[0]

    return {
      totalFeedback: parseInt(stats.total_feedback) || 0,
      averageRating: parseFloat(stats.avg_rating) || 0,
      feedbackThisMonth: parseInt(stats.feedback_this_month) || 0,
      mostRatedSolution: stats.most_rated_solution
    }
  }
}

export const feedbackService = new FeedbackService()
