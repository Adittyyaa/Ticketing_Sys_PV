import { safeQuery } from './database'
import type { 
  Ticket, 
  User, 
  Comment, 
  Solution, 
  CategoryData, 
  Tag, 
  TicketType, 
  CreateTicketData,
  UpdateTicketData,
  CreateUserData,
  UpdateUserData,
  CreateCommentData,
  CreateSolutionData,
  TicketAnalytics,
  UserStatistics,
  PaginatedResponse
} from '@/types/types'

// ============================================
// USER OPERATIONS
// ============================================

export async function createUser(userData: CreateUserData): Promise<User> {
  const result = await safeQuery<User>(
    `INSERT INTO users (email, password_hash, full_name, role, phone, job_title, company, email_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      userData.email,
      userData.password || null,
      userData.full_name || null,
      userData.role || 'user',
      userData.phone || null,
      userData.job_title || null,
      userData.company || null,
      true
    ]
  )
  return result.rows[0]
}

export async function getUserById(userId: string): Promise<User | null> {
  const result = await safeQuery<User>(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  )
  return result.rows[0] || null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await safeQuery<User>(
    'SELECT * FROM users WHERE email = $1',
    [email]
  )
  return result.rows[0] || null
}

export async function updateUser(userId: string, userData: UpdateUserData): Promise<User> {
  const fields = []
  const values = []
  let paramIndex = 1

  if (userData.full_name !== undefined) {
    fields.push(`full_name = $${paramIndex++}`)
    values.push(userData.full_name)
  }
  if (userData.phone !== undefined) {
    fields.push(`phone = $${paramIndex++}`)
    values.push(userData.phone)
  }
  if (userData.job_title !== undefined) {
    fields.push(`job_title = $${paramIndex++}`)
    values.push(userData.job_title)
  }
  if (userData.company !== undefined) {
    fields.push(`company = $${paramIndex++}`)
    values.push(userData.company)
  }
  if (userData.avatar_url !== undefined) {
    fields.push(`avatar_url = $${paramIndex++}`)
    values.push(userData.avatar_url)
  }

  values.push(userId)

  const result = await safeQuery<User>(
    `UPDATE users SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  )
  return result.rows[0]
}

export async function updateUserLastLogin(userId: string): Promise<void> {
  await safeQuery(
    'UPDATE users SET last_login = NOW() WHERE id = $1',
    [userId]
  )
}

// ============================================
// TICKET OPERATIONS
// ============================================

export async function createTicket(userId: string, ticketData: CreateTicketData): Promise<Ticket> {
  const result = await safeQuery<Ticket>(
    `INSERT INTO tickets (user_id, title, description, category_id, type_id, product, 
                         product_reference_number, priority, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      userId,
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
  return result.rows[0]
}

export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  const result = await safeQuery<Ticket>(
    'SELECT * FROM ticket_details WHERE id = $1',
    [ticketId]
  )
  return result.rows[0] || null
}

export async function getTickets(
  page = 1, 
  limit = 20, 
  filters: {
    status?: string
    priority?: string
    category_id?: string
    user_id?: string
    assigned_to?: string
  } = {}
): Promise<PaginatedResponse<Ticket>> {
  const offset = (page - 1) * limit
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

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Get total count
  const countResult = await safeQuery<{ count: string }>(
    `SELECT COUNT(*) as count FROM tickets ${whereClause}`,
    values
  )
  const total = parseInt(countResult.rows[0].count)

  // Get tickets
  const ticketsResult = await safeQuery<Ticket>(
    `SELECT * FROM ticket_details 
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

export async function updateTicket(ticketId: string, ticketData: UpdateTicketData): Promise<Ticket> {
  const fields: string[] = []
  const values: any[] = []
  let paramIndex = 1

  Object.entries(ticketData).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex++}`)
      values.push(value)
    }
  })

  values.push(ticketId)

  const result = await safeQuery<Ticket>(
    `UPDATE tickets SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  )
  return result.rows[0]
}

export async function deleteTicket(ticketId: string): Promise<void> {
  await safeQuery('DELETE FROM tickets WHERE id = $1', [ticketId])
}

// ============================================
// COMMENT OPERATIONS
// ============================================

export async function createComment(
  ticketId: string, 
  userId: string, 
  commentData: CreateCommentData
): Promise<Comment> {
  const result = await safeQuery<Comment>(
    `INSERT INTO comments (ticket_id, user_id, content, is_internal)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [ticketId, userId, commentData.content, commentData.is_internal || false]
  )
  return result.rows[0]
}

export async function getCommentsByTicketId(ticketId: string): Promise<Comment[]> {
  const result = await safeQuery<Comment>(
    `SELECT c.*, u.email as user_email, u.full_name as user_name
     FROM comments c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.ticket_id = $1
     ORDER BY c.created_at ASC`,
    [ticketId]
  )
  return result.rows
}

// ============================================
// CATEGORY OPERATIONS
// ============================================

export async function getCategories(): Promise<CategoryData[]> {
  const result = await safeQuery<CategoryData>(
    'SELECT * FROM categories ORDER BY name ASC'
  )
  return result.rows
}

export async function createCategory(name: string, description?: string, color?: string): Promise<CategoryData> {
  const result = await safeQuery<CategoryData>(
    'INSERT INTO categories (name, description, color) VALUES ($1, $2, $3) RETURNING *',
    [name, description || null, color || '#3B82F6']
  )
  return result.rows[0]
}

// ============================================
// TAG OPERATIONS
// ============================================

export async function getTags(): Promise<Tag[]> {
  const result = await safeQuery<Tag>(
    'SELECT * FROM tags ORDER BY name ASC'
  )
  return result.rows
}

export async function createTag(name: string, color?: string): Promise<Tag> {
  const result = await safeQuery<Tag>(
    'INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING *',
    [name, color || '#6B7280']
  )
  return result.rows[0]
}

// ============================================
// TICKET TYPE OPERATIONS
// ============================================

export async function getTicketTypes(): Promise<TicketType[]> {
  const result = await safeQuery<TicketType>(
    'SELECT * FROM ticket_types ORDER BY name ASC'
  )
  return result.rows
}

export async function createTicketType(
  name: string, 
  description?: string, 
  icon?: string
): Promise<TicketType> {
  const result = await safeQuery<TicketType>(
    'INSERT INTO ticket_types (name, description, icon) VALUES ($1, $2, $3) RETURNING *',
    [name, description || null, icon || null]
  )
  return result.rows[0]
}

// ============================================
// SOLUTION OPERATIONS
// ============================================

export async function createSolution(
  userId: string, 
  solutionData: CreateSolutionData
): Promise<Solution> {
  const result = await safeQuery<Solution>(
    `INSERT INTO solutions (title, description, steps, category_id, tags, is_published, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      solutionData.title,
      solutionData.description,
      solutionData.steps,
      solutionData.category_id || null,
      solutionData.tags || [],
      solutionData.is_published || false,
      userId
    ]
  )
  return result.rows[0]
}

export async function getSolutions(isPublished?: boolean): Promise<Solution[]> {
  const whereClause = isPublished !== undefined ? 'WHERE is_published = $1' : ''
  const params = isPublished !== undefined ? [isPublished] : []
  
  const result = await safeQuery<Solution>(
    `SELECT s.*, c.name as category_name, u.full_name as author_name
     FROM solutions s
     LEFT JOIN categories c ON s.category_id = c.id
     LEFT JOIN users u ON s.created_by = u.id
     ${whereClause}
     ORDER BY s.created_at DESC`,
    params
  )
  return result.rows
}

// ============================================
// ANALYTICS
// ============================================

export async function getTicketAnalytics(): Promise<TicketAnalytics> {
  const result = await safeQuery<TicketAnalytics>(
    'SELECT * FROM ticket_analytics'
  )
  return result.rows[0]
}

export async function getUserStatistics(): Promise<UserStatistics[]> {
  const result = await safeQuery<UserStatistics>(
    'SELECT * FROM user_statistics ORDER BY total_tickets_created DESC'
  )
  return result.rows
}

// ============================================
// SEARCH OPERATIONS
// ============================================

export async function searchTickets(
  searchTerm: string, 
  page = 1, 
  limit = 20
): Promise<PaginatedResponse<Ticket>> {
  const offset = (page - 1) * limit
  
  const searchQuery = `
    SELECT * FROM ticket_details 
    WHERE title ILIKE $1 OR description ILIKE $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `
  
  const countQuery = `
    SELECT COUNT(*) as count FROM tickets 
    WHERE title ILIKE $1 OR description ILIKE $1
  `
  
  const searchPattern = `%${searchTerm}%`
  
  const [ticketsResult, countResult] = await Promise.all([
    safeQuery<Ticket>(searchQuery, [searchPattern, limit, offset]),
    safeQuery<{ count: string }>(countQuery, [searchPattern])
  ])
  
  const total = parseInt(countResult.rows[0].count)
  
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

// ============================================
// UTILITY FUNCTIONS
// ============================================

export async function incrementSolutionViews(solutionId: string): Promise<void> {
  await safeQuery('SELECT increment_solution_views($1)', [solutionId])
}

export async function incrementSolutionHelpful(solutionId: string): Promise<void> {
  await safeQuery('SELECT increment_solution_helpful($1)', [solutionId])
}