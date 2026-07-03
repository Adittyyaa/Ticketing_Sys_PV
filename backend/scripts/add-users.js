#!/usr/bin/env node

/**
 * Add Multiple Users Script
 * Creates users with different roles for testing
 * 
 * Usage
 */

import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const users = [
  {
    email: 'admin@pvadvisory.com',
    password: 'AdminPassword123!',
    fullName: 'Admin User',
    role: 'admin',
    jobTitle: 'System Administrator',
    company: 'PV Advisory'
  },
  {
    email: 'agent@pvadvisory.com',
    password: 'AgentPassword123!',
    fullName: 'Support Agent',
    role: 'agent',
    jobTitle: 'Support Specialist',
    company: 'PV Advisory'
  },
  {
    email: 'user@pvadvisory.com',
    password: 'UserPassword123!',
    fullName: 'Client User',
    role: 'user',
    jobTitle: 'Operations Manager',
    company: 'Client Corp'
  },
  {
    email: 'testadmin@pvadvisory.com',
    password: 'AdminPassword123!',
    fullName: 'Test Admin',
    role: 'admin',
    jobTitle: 'IT Lead',
    company: 'PV Advisory'
  },
  {
    email: 'testagent@pvadvisory.com',
    password: 'AgentPassword123!',
    fullName: 'Test Agent',
    role: 'agent',
    jobTitle: 'Support Specialist',
    company: 'PV Advisory'
  }
]

async function addUsers() {
  const DATABASE_URL = process.env.DATABASE_URL

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required')
    process.exit(1)
  }

  console.log('👥 Adding users to database...')
  console.log('📍 Database:', DATABASE_URL.replace(/:[^:@]*@/, ':***@'))

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false }
      : false,
  })

  try {
    for (const user of users) {
      console.log(`\n➕ Creating user: ${user.email}`)
      
      const hashedPassword = await bcrypt.hash(user.password, 12)

      await pool.query(`
        INSERT INTO users (
          email, 
          password_hash, 
          full_name, 
          role, 
          job_title, 
          company, 
          email_verified, 
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW())
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          full_name = EXCLUDED.full_name,
          role = EXCLUDED.role,
          job_title = EXCLUDED.job_title,
          company = EXCLUDED.company,
          updated_at = NOW()
      `, [
        user.email,
        hashedPassword,
        user.fullName,
        user.role,
        user.jobTitle,
        user.company
      ])

      console.log(`   ✅ ${user.fullName} (${user.role})`)
    }

    // Show final user count
    const { rows } = await pool.query('SELECT COUNT(*) as count, role FROM users GROUP BY role')
    
    console.log('\n📊 User Summary:')
    rows.forEach(row => {
      console.log(`   - ${row.role}: ${row.count} users`)
    })

    console.log('\n🎉 All users created successfully!')
    console.log('\n🔑 Login Credentials:')
    console.log('┌─────────────────────────────┬──────────────┬─────────┐')
    console.log('│ Email                       │ Password     │ Role    │')
    console.log('├─────────────────────────────┼──────────────┼─────────┤')
    users.forEach(user => {
      console.log(`│ ${user.email.padEnd(27)} │ ${user.password.padEnd(12)} │ ${user.role.padEnd(7)} │`)
    })
    console.log('└─────────────────────────────┴──────────────┴─────────┘')

  } catch (error) {
    console.error('❌ Failed to add users:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addUsers().catch(console.error)
}

export { addUsers }