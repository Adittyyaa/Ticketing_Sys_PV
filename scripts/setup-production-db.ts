#!/usr/bin/env tsx

/**
 * Production Database Setup Script
 * Run this once to initialize your production PostgreSQL database
 * 
 * Usage: npx tsx scripts/setup-production-db.ts
 */

import { readFile } from 'fs/promises'
import { join } from 'path'
import { Pool } from 'pg'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function setupDatabase() {
  const DATABASE_URL = process.env.DATABASE_URL

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required')
    console.log('Set it like: DATABASE_URL=postgresql://user:pass@host:port/db')
    process.exit(1)
  }

  console.log('🚀 Setting up production database...')
  console.log('📍 Database:', DATABASE_URL.replace(/:[^:@]*@/, ':***@'))

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })

  try {
    // Test connection
    console.log('🔌 Testing database connection...')
    await pool.query('SELECT NOW()')
    console.log('✅ Database connection successful')

    // Read and execute setup script
    console.log('📄 Reading database setup script...')
    const setupScript = await readFile(
      join(__dirname, '..', 'database-setup-postgresql.sql'),
      'utf8'
    )

    console.log('⚡ Executing database setup script...')
    await pool.query(setupScript)

    // Verify tables were created
    console.log('🔍 Verifying table creation...')
    const { rows } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)

    console.log('✅ Database setup completed successfully!')
    console.log(`📊 Created ${rows.length} tables:`)
    rows.forEach(row => console.log(`   - ${row.table_name}`))

    // Show quick stats
    console.log('\n📈 Initial data:')
    
    const stats = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM categories'),
      pool.query('SELECT COUNT(*) as count FROM tags'),
      pool.query('SELECT COUNT(*) as count FROM ticket_types'),
      pool.query('SELECT COUNT(*) as count FROM custom_statuses'),
    ])

    console.log(`   - Categories: ${stats[0].rows[0].count}`)
    console.log(`   - Tags: ${stats[1].rows[0].count}`)
    console.log(`   - Ticket Types: ${stats[2].rows[0].count}`)
    console.log(`   - Custom Statuses: ${stats[3].rows[0].count}`)

    console.log('\n🎉 Your database is ready for production!')
    console.log('🔗 You can now deploy your application to Vercel')

  } catch (error: any) {
    console.error('❌ Database setup failed:', error)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Connection refused. Check:')
      console.log('   - Database server is running')
      console.log('   - Connection string is correct')
      console.log('   - Firewall allows connections')
    } else if (error.code === '28P01') {
      console.log('\n💡 Authentication failed. Check:')
      console.log('   - Username and password are correct')
      console.log('   - User has necessary permissions')
    } else if (error.code === '3D000') {
      console.log('\n💡 Database not found. Check:')
      console.log('   - Database name in connection string')
      console.log('   - Database exists on server')
    }
    
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Create admin user helper function
async function createAdminUser(email: string, password: string, fullName: string) {
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is required')
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })

  try {
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 12)

    await pool.query(`
      INSERT INTO users (email, password_hash, full_name, role, email_verified, created_at)
      VALUES ($1, $2, $3, 'admin', TRUE, NOW())
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        full_name = EXCLUDED.full_name,
        role = 'admin',
        updated_at = NOW()
    `, [email, hashedPassword, fullName])

    console.log(`✅ Admin user created/updated: ${email}`)
  } finally {
    await pool.end()
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  
  if (args.includes('--create-admin')) {
    const email = args[args.indexOf('--email') + 1]
    const password = args[args.indexOf('--password') + 1]
    const fullName = args[args.indexOf('--name') + 1] || 'Administrator'

    if (!email || !password) {
      console.error('❌ Admin creation requires --email and --password')
      console.log('Usage: npx tsx scripts/setup-production-db.ts --create-admin --email admin@example.com --password yourpassword --name "Admin Name"')
      process.exit(1)
    }

    createAdminUser(email, password, fullName).catch(console.error)
  } else {
    setupDatabase().catch(console.error)
  }
}

export { setupDatabase, createAdminUser }