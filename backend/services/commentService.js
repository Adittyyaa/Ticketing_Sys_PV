import { safeQuery } from '../lib/database.js'

export class CommentService {
  async getTicketComments(ticketId, requesterUserId, requesterRole) {
    // 1. Verify ticket exists and requester has access to it
    const ticketResult = await safeQuery(
      'SELECT id, user_id FROM tickets WHERE id = $1',
      [ticketId]
    )
    const ticket = ticketResult.rows[0]
    if (!ticket) {
      throw new Error('Ticket not found')
    }

    const isAdminOrAgent = requesterRole === 'admin' || requesterRole === 'agent'
    if (!isAdminOrAgent && ticket.user_id !== requesterUserId) {
      throw new Error('Access denied: You can only view comments for your own tickets')
    }

    // 2. Query comments. If not admin/agent, exclude internal comments.
    let query = `
      SELECT c.*, u.full_name as commenter_name, u.role as commenter_role
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = $1
    `
    const params = [ticketId]

    if (!isAdminOrAgent) {
      query += ' AND c.is_internal = false'
    }

    query += ' ORDER BY c.created_at ASC'

    const result = await safeQuery(query, params)
    return result.rows
  }

  async addTicketComment(ticketId, userId, requesterRole, content, isInternal = false) {
    // 1. Verify ticket exists and requester has access
    const ticketResult = await safeQuery(
      'SELECT id, user_id FROM tickets WHERE id = $1',
      [ticketId]
    )
    const ticket = ticketResult.rows[0]
    if (!ticket) {
      throw new Error('Ticket not found')
    }

    const isAdminOrAgent = requesterRole === 'admin' || requesterRole === 'agent'
    if (!isAdminOrAgent && ticket.user_id !== userId) {
      throw new Error('Access denied: You can only comment on your own tickets')
    }

    // Non-admin/agent cannot post internal comments
    const finalIsInternal = isAdminOrAgent ? isInternal : false

    // 2. Insert comment
    const result = await safeQuery(
      `INSERT INTO comments (ticket_id, user_id, content, is_internal)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [ticketId, userId, content, finalIsInternal]
    )

    const comment = result.rows[0]

    // Fetch commenter name for response
    const userResult = await safeQuery(
      'SELECT full_name FROM users WHERE id = $1',
      [userId]
    )
    comment.commenter_name = userResult.rows[0]?.full_name || 'Anonymous'

    return comment
  }

  async deleteComment(commentId, userId, requesterRole) {
    // 1. Fetch comment
    const commentResult = await safeQuery(
      'SELECT * FROM comments WHERE id = $1',
      [commentId]
    )
    const comment = commentResult.rows[0]
    if (!comment) {
      throw new Error('Comment not found')
    }

    // 2. Check if requester has permission to delete (admin or the author of the comment)
    const isAdmin = requesterRole === 'admin'
    if (!isAdmin && comment.user_id !== userId) {
      throw new Error('Access denied: You can only delete your own comments')
    }

    // 3. Delete comment
    await safeQuery(
      'DELETE FROM comments WHERE id = $1',
      [commentId]
    )
    return true
  }
}

export const commentService = new CommentService()
