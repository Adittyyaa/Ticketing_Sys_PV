import { safeQuery } from '../lib/database.js'

class UserService {
  // ============================================
  // USER CRUD OPERATIONS
  // ============================================

  async createUser(userData) {
    const result = await safeQuery(
      `INSERT INTO users (email, password_hash, full_name, role, phone, job_title, company, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userData.email,
        userData.password_hash || null,
        userData.full_name || null,
        userData.role || 'user',
        userData.phone || null,
        userData.job_title || null,
        userData.company || null,
        userData.email_verified || true
      ]
    )
    return result.rows[0]
  }

  async getUserById(userId) {
    const result = await safeQuery(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    )
    return result.rows[0] || null
  }

  async getUserByEmail(email) {
    const result = await safeQuery(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )
    return result.rows[0] || null
  }

  async updateUser(userId, userData) {
    const fields = []
    const values = []
    let paramIndex = 1

    const allowedFields = ['full_name', 'phone', 'job_title', 'company', 'avatar_url']
    
    allowedFields.forEach(field => {
      if (userData[field] !== undefined) {
        fields.push(`${field} = $${paramIndex++}`)
        values.push(userData[field])
      }
    })

    if (fields.length === 0) {
      return await this.getUserById(userId)
    }

    values.push(userId)

    const result = await safeQuery(
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    )
    return result.rows[0]
  }

  async updateLastLogin(userId) {
    await safeQuery(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [userId]
    )
  }

  async updatePassword(userId, passwordHash) {
    const result = await safeQuery(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [passwordHash, userId]
    )
    return result.rows[0]
  }

  async deleteUser(userId) {
    const result = await safeQuery(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [userId]
    )
    return result.rows[0]
  }

  async updateUserRole(userId, newRole) {
    const allowedRoles = ['user', 'agent', 'admin']
    
    if (!allowedRoles.includes(newRole)) {
      throw new Error('Invalid role')
    }

    const result = await safeQuery(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [newRole, userId]
    )

    if (!result.rows[0]) {
      throw new Error('User not found')
    }

    return result.rows[0]
  }

  async verifyUserEmail(userId) {
    const result = await safeQuery(
      'UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1 RETURNING *',
      [userId]
    )

    if (!result.rows[0]) {
      throw new Error('User not found')
    }

    return result.rows[0]
  }

  // ============================================
  // USER QUERIES
  // ============================================

  async getAllUsers(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit
    const conditions = []
    const values = []
    let paramIndex = 1

    if (filters.role) {
      conditions.push(`role = $${paramIndex++}`)
      values.push(filters.role)
    }
    if (filters.email_verified !== undefined) {
      conditions.push(`email_verified = $${paramIndex++}`)
      values.push(filters.email_verified)
    }
    if (filters.search) {
      conditions.push(`(full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`)
      values.push(`%${filters.search}%`)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countResult = await safeQuery(
      `SELECT COUNT(*) as count FROM users ${whereClause}`,
      values
    )
    const total = parseInt(countResult.rows[0].count)

    const usersResult = await safeQuery(
      `SELECT id, email, full_name, role, phone, job_title, company, 
              email_verified, avatar_url, created_at, updated_at, last_login
       FROM users 
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...values, limit, offset]
    )

    return {
      data: usersResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async getUserStatistics() {
    const result = await safeQuery(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'agent' THEN 1 END) as agent_count,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count,
        COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_this_month
      FROM users
    `)

    return result.rows[0]
  }

  async getUsersWithRecentActivity(days = 30) {
    // Validate days is a number to prevent SQL injection
    const validDays = parseInt(days) || 30
    
    const result = await safeQuery(
      `SELECT id, email, full_name, role, last_login,
              COUNT(t.id) as ticket_count
       FROM users u
       LEFT JOIN tickets t ON u.id = t.user_id 
         AND t.created_at >= NOW() - INTERVAL '1 day' * $1
       WHERE u.last_login >= NOW() - INTERVAL '1 day' * $1
       GROUP BY u.id, u.email, u.full_name, u.role, u.last_login
       ORDER BY u.last_login DESC`,
      [validDays]
    )

    return result.rows
  }

  // ============================================
  // PERMISSION CHECKS
  // ============================================

  canDeleteUser(requesterId, requesterRole, targetUserId) {
    if (requesterId === targetUserId) {
      return { allowed: false, reason: 'Cannot delete your own account' }
    }
    if (requesterRole !== 'admin') {
      return { allowed: false, reason: 'Admin access required' }
    }
    return { allowed: true }
  }
}

export const userService = new UserService()
