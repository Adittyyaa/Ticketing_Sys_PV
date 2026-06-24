#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { pool } from '../lib/database'
import { hashPassword } from '../lib/auth'

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''

async function migrateFromSupabase() {
  console.log('🚀 Starting Supabase to PostgreSQL migration...')

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  
  try {
    // Test connections
    console.log('🔍 Testing database connections...')
    
    // Test Supabase connection
    const { error: supabaseError } = await supabase
      .from('tbl_users')
      .select('count')
      .limit(1)
    
    if (supabaseError) {
      throw new Error(`Supabase connection failed: ${supabaseError.message}`)
    }

    // Test PostgreSQL connection
    const pgResult = await pool.query('SELECT 1')
    if (!pgResult) {
      throw new Error('PostgreSQL connection failed')
    }

    console.log('✅ Database connections verified')

    // 1. Migrate Categories
    await migrateCategories(supabase)

    // 2. Migrate Tags
    await migrateTags(supabase)

    // 3. Migrate Ticket Types
    await migrateTicketTypes(supabase)

    // 4. Migrate Custom Statuses
    await migrateCustomStatuses(supabase)

    // 5. Migrate Users
    await migrateUsers(supabase)

    // 6. Migrate Tickets
    await migrateTickets(supabase)

    // 7. Migrate Comments
    await migrateComments(supabase)

    // 8. Migrate Solutions
    await migrateSolutions(supabase)

    // 9. Migrate Feedback
    await migrateFeedback(supabase)

    // 10. Migrate Contacts
    await migrateContacts(supabase)

    console.log('🎉 Migration completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

async function migrateCategories(supabase: any) {
  console.log('📂 Migrating categories...')
  
  const { data: categories, error } = await supabase
    .from('tbl_categories')
    .select('*')

  if (error) {
    console.warn('⚠️  No categories found or error:', error.message)
    return
  }

  if (!categories?.length) {
    console.log('   No categories to migrate')
    return
  }

  for (const category of categories) {
    await pool.query(
      `INSERT INTO categories (id, name, created_at) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (name) DO NOTHING`,
      [category.id, category.name, category.created_at]
    )
  }

  console.log(`   ✅ Migrated ${categories.length} categories`)
}

async function migrateTags(supabase: any) {
  console.log('🏷️  Migrating tags...')
  
  const { data: tags, error } = await supabase
    .from('tbl_tags')
    .select('*')

  if (error) {
    console.warn('⚠️  No tags found or error:', error.message)
    return
  }

  if (!tags?.length) {
    console.log('   No tags to migrate')
    return
  }

  for (const tag of tags) {
    await pool.query(
      `INSERT INTO tags (id, name, created_at) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (name) DO NOTHING`,
      [tag.id, tag.name, tag.created_at]
    )
  }

  console.log(`   ✅ Migrated ${tags.length} tags`)
}

async function migrateTicketTypes(supabase: any) {
  console.log('🎫 Migrating ticket types...')
  
  const { data: ticketTypes, error } = await supabase
    .from('tbl_ticket_types')
    .select('*')

  if (error) {
    console.warn('⚠️  No ticket types found or error:', error.message)
    return
  }

  if (!ticketTypes?.length) {
    console.log('   No ticket types to migrate')
    return
  }

  for (const ticketType of ticketTypes) {
    await pool.query(
      `INSERT INTO ticket_types (id, name, description, created_at) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (name) DO NOTHING`,
      [ticketType.id, ticketType.name, ticketType.description, ticketType.created_at]
    )
  }

  console.log(`   ✅ Migrated ${ticketTypes.length} ticket types`)
}

async function migrateCustomStatuses(supabase: any) {
  console.log('🔄 Migrating custom statuses...')
  
  const { data: statuses, error } = await supabase
    .from('tbl_custom_statuses')
    .select('*')

  if (error) {
    console.warn('⚠️  No custom statuses found or error:', error.message)
    return
  }

  if (!statuses?.length) {
    console.log('   No custom statuses to migrate')
    return
  }

  for (const status of statuses) {
    await pool.query(
      `INSERT INTO custom_statuses (id, name, color, created_at) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (name) DO NOTHING`,
      [status.id, status.name, status.color, status.created_at]
    )
  }

  console.log(`   ✅ Migrated ${statuses.length} custom statuses`)
}

async function migrateUsers(supabase: any) {
  console.log('👥 Migrating users...')
  
  const { data: users, error } = await supabase
    .from('tbl_users')
    .select('*')

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }

  if (!users?.length) {
    console.log('   No users to migrate')
    return
  }

  // Generate default password hash for migrated users
  const defaultPasswordHash = await hashPassword('changeme123')

  for (const user of users) {
    await pool.query(
      `INSERT INTO users (id, email, password_hash, full_name, role, phone, job_title, company, email_verified, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       ON CONFLICT (email) DO NOTHING`,
      [
        user.id,
        user.email,
        defaultPasswordHash, // Users will need to reset their passwords
        user.full_name,
        user.role || 'user',
        user.phone,
        user.job_title,
        user.company,
        true,
        user.created_at
      ]
    )
  }

  console.log(`   ✅ Migrated ${users.length} users`)
  console.log('   ⚠️  All users have been given the default password "changeme123" - they should reset their passwords')
}

async function migrateTickets(supabase: any) {
  console.log('🎫 Migrating tickets...')
  
  const { data: tickets, error } = await supabase
    .from('tbl_tickets')
    .select('*')

  if (error) {
    throw new Error(`Failed to fetch tickets: ${error.message}`)
  }

  if (!tickets?.length) {
    console.log('   No tickets to migrate')
    return
  }

  // Get category and type mappings
  const categoryMap = new Map()
  const typeMap = new Map()
  
  const { data: categories } = await supabase.from('tbl_categories').select('id, name')
  categories?.forEach((cat: any) => categoryMap.set(cat.name, cat.id))
  
  const { data: types } = await supabase.from('tbl_ticket_types').select('id, name')
  types?.forEach((type: any) => typeMap.set(type.name, type.id))

  for (const ticket of tickets) {
    const categoryId = categoryMap.get(ticket.category) || null
    const typeId = typeMap.get(ticket.type) || null
    
    await pool.query(
      `INSERT INTO tickets (id, number, title, description, category_id, type_id, product, 
                           product_reference_number, priority, status, tags, user_id, assigned_to, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
       ON CONFLICT (id) DO NOTHING`,
      [
        ticket.id,
        ticket.number,
        ticket.title,
        ticket.description,
        categoryId,
        typeId,
        ticket.product,
        ticket.product_reference_number,
        ticket.priority,
        ticket.status,
        ticket.tags || [],
        ticket.user_id,
        ticket.assigned_to,
        ticket.created_at,
        ticket.updated_at
      ]
    )
  }

  console.log(`   ✅ Migrated ${tickets.length} tickets`)
}

async function migrateComments(supabase: any) {
  console.log('💬 Migrating comments...')
  
  const { data: comments, error } = await supabase
    .from('tbl_comments')
    .select('*')

  if (error) {
    console.warn('⚠️  No comments found or error:', error.message)
    return
  }

  if (!comments?.length) {
    console.log('   No comments to migrate')
    return
  }

  for (const comment of comments) {
    await pool.query(
      `INSERT INTO comments (id, ticket_id, user_id, content, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (id) DO NOTHING`,
      [
        comment.id,
        comment.ticket_id,
        comment.user_id,
        comment.content,
        comment.created_at,
        comment.updated_at
      ]
    )
  }

  console.log(`   ✅ Migrated ${comments.length} comments`)
}

async function migrateSolutions(supabase: any) {
  console.log('💡 Migrating solutions...')
  
  const { data: solutions, error } = await supabase
    .from('tbl_solutions')
    .select('*')

  if (error) {
    console.warn('⚠️  No solutions found or error:', error.message)
    return
  }

  if (!solutions?.length) {
    console.log('   No solutions to migrate')
    return
  }

  const categoryMap = new Map()
  const { data: categories } = await supabase.from('tbl_categories').select('id, name')
  categories?.forEach((cat: any) => categoryMap.set(cat.name, cat.id))

  for (const solution of solutions) {
    const categoryId = categoryMap.get(solution.category) || null
    
    await pool.query(
      `INSERT INTO solutions (id, title, description, steps, category_id, is_published, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       ON CONFLICT (id) DO NOTHING`,
      [
        solution.id,
        solution.title,
        solution.description,
        solution.steps,
        categoryId,
        true, // Mark as published
        solution.created_at,
        solution.updated_at
      ]
    )
  }

  console.log(`   ✅ Migrated ${solutions.length} solutions`)
}

async function migrateFeedback(supabase: any) {
  console.log('📝 Migrating feedback...')
  
  const { data: feedback, error } = await supabase
    .from('tbl_feedback')
    .select('*')

  if (error) {
    console.warn('⚠️  No feedback found or error:', error.message)
    return
  }

  if (!feedback?.length) {
    console.log('   No feedback to migrate')
    return
  }

  for (const item of feedback) {
    await pool.query(
      `INSERT INTO feedback (id, user_id, category, rating, message, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (id) DO NOTHING`,
      [
        item.id,
        item.user_id,
        item.category,
        item.rating,
        item.message,
        item.created_at
      ]
    )
  }

  console.log(`   ✅ Migrated ${feedback.length} feedback items`)
}

async function migrateContacts(supabase: any) {
  console.log('📞 Migrating contacts...')
  
  const { data: contacts, error } = await supabase
    .from('tbl_contacts')
    .select('*')

  if (error) {
    console.warn('⚠️  No contacts found or error:', error.message)
    return
  }

  if (!contacts?.length) {
    console.log('   No contacts to migrate')
    return
  }

  for (const contact of contacts) {
    await pool.query(
      `INSERT INTO contacts (id, name, email, phone, position, department, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (id) DO NOTHING`,
      [
        contact.id,
        contact.name,
        contact.email,
        contact.phone,
        contact.position,
        contact.department,
        contact.created_at
      ]
    )
  }

  console.log(`   ✅ Migrated ${contacts.length} contacts`)
}

// Run the migration
if (require.main === module) {
  migrateFromSupabase()
}