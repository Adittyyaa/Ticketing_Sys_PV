import { safeQuery } from '../lib/database.js'
import cache, { CACHE_KEYS, CACHE_TTL } from '../utils/cache.js'

class TicketService {

  isAdminOrAgent(role) {
    return role === 'admin' || role === 'agent'
  }

  buildTicketConditions(filters = {}) {
    const conditions = []
    const values = []
    let paramIndex = 1

    if (filters.status) {
      conditions.push(`status = $${paramIndex++}`)
      values.push(filters.status)
    }
    if (filters.priority) {
      conditions.push(`priority = $${paramIndex++}`)
      values.push(filters.priority)
    }
    if (filters.category_id) {
      conditions.push(`category_id = $${paramIndex++}`)
      values.push(filters.category_id)
    }
    if (filters.user_id) {
      conditions.push(`user_id = $${paramIndex++}`)
      values.push(filters.user_id)
    }
    if (filters.assigned_to) {
      conditions.push(`assigned_to = $${paramIndex++}`)
      values.push(filters.assigned_to)
    }
    if (filters.search) {
      conditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`)
      values.push(`%${filters.search}%`)
      paramIndex++
    }

    return { conditions, values, paramIndex }
  }

  applyUserRestrictions(filters, requesterId, requesterRole) {
    if (!this.isAdminOrAgent(requesterRole)) {
      filters.user_id = requesterId
    }
    return filters
  }

  // ============================================
  // CACHED ANALYTICS METHODS
  // ============================================

  async getTicketAnalytics() {
    const cached = cache.get(CACHE_KEYS.TICKET_ANALYTICS);
    if (cached) return cached;

    const result = await safeQuery(`
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(*) FILTER (WHERE status = 'UNTOUCHED') as untouched_tickets,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending_tickets,
        COUNT(*) FILTER (WHERE status = 'OPENED') as opened_tickets,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress_tickets,
        COUNT(*) FILTER (WHERE status = 'SOLVED') as solved_tickets,
        COUNT(*) FILTER (WHERE status = 'CLOSED') as closed_tickets,
        COUNT(*) FILTER (WHERE priority = 'HIGH') as high_priority,
        COUNT(*) FILTER (WHERE priority = 'MEDIUM') as medium_priority,
        COUNT(*) FILTER (WHERE priority = 'LOW') as low_priority,
        COUNT(*) FILTER (WHERE priority = 'URGENT') as urgent_priority,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as tickets_today,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as tickets_this_week,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as tickets_this_month
      FROM tickets
    `);

    const analytics = result.rows[0];
    // Convert string counts to integers
    Object.keys(analytics).forEach(key => {
      analytics[key] = parseInt(analytics[key]) || 0;
    });

    return cache.set(CACHE_KEYS.TICKET_ANALYTICS, analytics, CACHE_TTL.TICKET_ANALYTICS);
  }

  async getTicketsByCategory() {
    const result = await safeQuery(`
      SELECT c.name as category_name, c.color, COUNT(t.id)::int as ticket_count
      FROM categories c
      LEFT JOIN tickets t ON c.id = t.category_id
      GROUP BY c.id, c.name, c.color
      ORDER BY ticket_count DESC
    `);
    return result.rows;
  }

  async getTicketsByAgent() {
    const result = await safeQuery(`
      SELECT u.full_name as agent_name, COUNT(t.id)::int as ticket_count
      FROM users u
      LEFT JOIN tickets t ON u.id = t.assigned_to
      WHERE u.role IN ('admin', 'agent')
      GROUP BY u.id, u.full_name
      ORDER BY ticket_count DESC
    `);
    return result.rows;
  }

  async getRecentTickets(limit = 10) {
    const cacheKey = `${CACHE_KEYS.RECENT_TICKETS}_${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const result = await safeQuery(
      `SELECT * FROM ticket_details_fast 
       ORDER BY created_at DESC 
       LIMIT $1`,
      [limit]
    );

    return cache.set(cacheKey, result.rows, CACHE_TTL.RECENT_TICKETS);
  }

  // ============================================
  // TICKET CRUD OPERATIONS
  // ============================================

  async createTicket(requesterId, ticketData) {
    const result = await safeQuery(
      `INSERT INTO tickets (user_id, title, description, category_id, type_id, product, 
                            product_reference_number, priority, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        requesterId,
        ticketData.title,
        ticketData.description,
        ticketData.category_id || null,
        ticketData.type_id || null,
        ticketData.product || null,
        ticketData.product_reference_number || null,
        ticketData.priority || 'MEDIUM',
        ticketData.tags || []
      ]
    )

    // Invalidate relevant caches
    cache.delete(CACHE_KEYS.TICKET_ANALYTICS);
    cache.delete(CACHE_KEYS.RECENT_TICKETS);

    return result.rows[0]
  }

  async getTicketById(ticketId, requesterId, requesterRole) {
    // Use the fast view for better performance
    const result = await safeQuery(
      'SELECT * FROM ticket_details_fast WHERE id = $1',
      [ticketId]
    )
    const ticket = result.rows[0] || null

    if (!ticket) {
      throw new Error('Ticket not found')
    }

    const canAccess = this.isAdminOrAgent(requesterRole) || ticket.user_id === requesterId
    if (!canAccess) {
      throw new Error('Access denied: You can only view your own tickets')
    }

    // Get counts separately only when needed (lazy loading)
    const [commentsResult, attachmentsResult] = await Promise.all([
      safeQuery('SELECT COUNT(*)::int as count FROM comments WHERE ticket_id = $1', [ticketId]),
      safeQuery('SELECT COUNT(*)::int as count FROM attachments WHERE ticket_id = $1', [ticketId])
    ])

    ticket.comment_count = commentsResult.rows[0].count
    ticket.attachment_count = attachmentsResult.rows[0].count

    return ticket
  }

  async getTickets(requesterId, requesterRole, page = 1, limit = 20, filters = {}) {
    const restrictedFilters = this.applyUserRestrictions({ ...filters }, requesterId, requesterRole)
    const { conditions, values, paramIndex } = this.buildTicketConditions(restrictedFilters)
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const offset = (page - 1) * limit
    const limitParam = paramIndex
    const offsetParam = paramIndex + 1

    // Use optimized queries
    const countResult = await safeQuery(
      `SELECT COUNT(*) as count FROM tickets ${whereClause}`,
      values
    )
    const total = parseInt(countResult.rows[0].count)

    // Use fast view without expensive subqueries
    const ticketsResult = await safeQuery(
      `SELECT * FROM ticket_details_fast 
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...values, limit, offset]
    )

    return {
      data: ticketsResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async updateTicket(ticketId, requesterId, requesterRole, updateData) {
    const existingResult = await safeQuery(
      'SELECT * FROM ticket_details WHERE id = $1',
      [ticketId]
    )
    const existingTicket = existingResult.rows[0]

    if (!existingTicket) {
      throw new Error('Ticket not found')
    }

    const canEdit = this.isAdminOrAgent(requesterRole) || existingTicket.user_id === requesterId
    if (!canEdit) {
      throw new Error('Access denied: You can only edit your own tickets')
    }

    if (!this.isAdminOrAgent(requesterRole)) {
      const allowedFields = ['title', 'description', 'priority']
      const restrictedFields = Object.keys(updateData).filter(
        field => !allowedFields.includes(field)
      )
      if (restrictedFields.length > 0) {
        throw new Error(`Access denied: You cannot update the following fields: ${restrictedFields.join(', ')}`)
      }
    }

    return this.performUpdateTicket(ticketId, updateData)
  }

  async performUpdateTicket(ticketId, ticketData) {
    const fields = []
    const values = []
    let paramIndex = 1

    const allowedFields = [
      'title', 'description', 'status', 'priority', 'category_id', 
      'type_id', 'assigned_to', 'tags', 'product', 'product_reference_number'
    ]

    allowedFields.forEach(field => {
      if (ticketData[field] !== undefined) {
        fields.push(`${field} = $${paramIndex++}`)
        values.push(ticketData[field])
      }
    })

    if (fields.length === 0) {
      const result = await safeQuery('SELECT * FROM ticket_details_fast WHERE id = $1', [ticketId])
      return result.rows[0]
    }

    values.push(ticketId)

    // Update resolved_at timestamp when status changes to SOLVED
    if (ticketData.status === 'SOLVED') {
      fields.push(`resolved_at = NOW()`)
    }

    const result = await safeQuery(
      `UPDATE tickets SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    )

    // Invalidate relevant caches when ticket is updated
    cache.delete(CACHE_KEYS.TICKET_ANALYTICS);
    cache.delete(CACHE_KEYS.RECENT_TICKETS);

    return result.rows[0]
  }

  async deleteTicket(ticketId, requesterId, requesterRole) {
    const existingResult = await safeQuery(
      'SELECT * FROM ticket_details WHERE id = $1',
      [ticketId]
    )
    const existingTicket = existingResult.rows[0]

    if (!existingTicket) {
      throw new Error('Ticket not found')
    }

    const canDelete = this.isAdminOrAgent(requesterRole) || 
                     (existingTicket.user_id === requesterId && existingTicket.status === 'UNTOUCHED')

    if (!canDelete) {
      throw new Error('Access denied: You can only delete your own open tickets')
    }

    const result = await safeQuery(
      'DELETE FROM tickets WHERE id = $1 RETURNING *',
      [ticketId]
    )
    return result.rows[0]
  }

  async bulkDeleteTickets(ticketIds, requesterRole) {
    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      throw new Error('Invalid ticket IDs provided')
    }

    if (!this.isAdminOrAgent(requesterRole)) {
      throw new Error('Access denied: Only admins and agents can bulk delete tickets')
    }

    const placeholders = ticketIds.map((_, index) => `$${index + 1}`).join(', ')
    const result = await safeQuery(
      `DELETE FROM tickets WHERE id IN (${placeholders}) RETURNING id`,
      ticketIds
    )
    return result.rows
  }

 

  async searchTickets(searchTerm, requesterId, requesterRole, filters = {}, page = 1, limit = 20) {
    const offset = (page - 1) * limit
    const restrictedFilters = this.applyUserRestrictions({ ...filters }, requesterId, requesterRole)

    const conditions = [`(title ILIKE $1 OR description ILIKE $1)`]
    const values = [`%${searchTerm}%`]
    let paramIndex = 2

    if (restrictedFilters.status) {
      conditions.push(`status = $${paramIndex++}`)
      values.push(restrictedFilters.status)
    }
    if (restrictedFilters.priority) {
      conditions.push(`priority = $${paramIndex++}`)
      values.push(restrictedFilters.priority)
    }
    if (restrictedFilters.user_id) {
      conditions.push(`user_id = $${paramIndex++}`)
      values.push(restrictedFilters.user_id)
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`

    const countResult = await safeQuery(
      `SELECT COUNT(*) as count FROM tickets ${whereClause}`,
      values
    )
    const total = parseInt(countResult.rows[0].count)

    const ticketsResult = await safeQuery(
      `SELECT * FROM ticket_details_fast 
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...values, limit, offset]
    )

    return {
      data: ticketsResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async getTicketAnalytics() {
    const result = await safeQuery(`
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'UNTOUCHED' THEN 1 END) as untouched_tickets,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_tickets,
        COUNT(CASE WHEN status = 'OPENED' THEN 1 END) as opened_tickets,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_tickets,
        COUNT(CASE WHEN status = 'SOLVED' THEN 1 END) as solved_tickets,
        COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as closed_tickets,
        COUNT(CASE WHEN priority = 'HIGH' THEN 1 END) as high_priority,
        COUNT(CASE WHEN priority = 'MEDIUM' THEN 1 END) as medium_priority,
        COUNT(CASE WHEN priority = 'LOW' THEN 1 END) as low_priority,
        COUNT(CASE WHEN priority = 'URGENT' THEN 1 END) as urgent_priority,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as tickets_today,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as tickets_this_week,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as tickets_this_month
      FROM tickets
    `)

    return result.rows[0]
  }

  async getTicketsByCategory() {
    const result = await safeQuery(`
      SELECT 
        c.name as category_name,
        COUNT(t.id) as ticket_count
      FROM categories c
      LEFT JOIN tickets t ON c.id = t.category_id
      GROUP BY c.id, c.name
      ORDER BY ticket_count DESC
    `)

    return result.rows
  }

  async getTicketsByAgent() {
    const result = await safeQuery(`
      SELECT 
        u.full_name,
        u.email,
        COUNT(t.id) as assigned_tickets,
        COUNT(CASE WHEN t.status = 'SOLVED' THEN 1 END) as solved_tickets,
        COUNT(CASE WHEN t.status = 'CLOSED' THEN 1 END) as closed_tickets
      FROM users u
      LEFT JOIN tickets t ON u.id = t.assigned_to
      WHERE u.role IN ('agent', 'admin')
      GROUP BY u.id, u.full_name, u.email
      ORDER BY assigned_tickets DESC
    `)

    return result.rows
  }

  async getUserTickets(targetUserId, requesterId, requesterRole, page = 1, limit = 20, filters = {}) {
    const canViewAll = this.isAdminOrAgent(requesterRole)
    const isOwnTickets = targetUserId === requesterId

    if (!canViewAll && !isOwnTickets) {
      throw new Error('Access denied: You can only view your own tickets')
    }

    // For non-admin/agent, enforce viewing own tickets
    const effectiveUserId = canViewAll ? targetUserId : requesterId
    const userFilters = { ...filters, user_id: effectiveUserId }

    return this.getTickets(requesterId, requesterRole, page, limit, userFilters)
  }

  async assignTicket(ticketId, requesterId, requesterRole, agentId) {
    const existingResult = await safeQuery(
      'SELECT * FROM ticket_details WHERE id = $1',
      [ticketId]
    )
    const existingTicket = existingResult.rows[0]

    if (!existingTicket) {
      throw new Error('Ticket not found')
    }

    if (!this.isAdminOrAgent(requesterRole)) {
      throw new Error('Access denied: Only agents and admins can assign tickets')
    }

    const result = await safeQuery(
      `UPDATE tickets 
       SET assigned_to = $1, 
           status = CASE WHEN status IN ('UNTOUCHED', 'OPENED', 'PENDING') THEN 'IN_PROGRESS' ELSE status END,
           updated_at = NOW()
       WHERE id = $2 
       RETURNING *`,
      [agentId, ticketId]
    )

    if (!result.rows[0]) {
      throw new Error('Ticket not found')
    }

    return result.rows[0]
  }

  async getRecentTickets(limit = 10) {
    const result = await safeQuery(
      `SELECT * FROM ticket_details 
       ORDER BY created_at DESC 
       LIMIT $1`,
      [limit]
    )

    return result.rows
  }

  async getTicketsAssignedTo(agentId, requesterId, requesterRole, page = 1, limit = 20) {
    if (!this.isAdminOrAgent(requesterRole) && agentId !== requesterId) {
      throw new Error('Access denied: You can only view your own assigned tickets')
    }

    const filters = { assigned_to: agentId }
    return this.getTickets(requesterId, requesterRole, page, limit, filters)
  }
}

export const ticketService = new TicketService()
