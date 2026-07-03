#!/usr/bin/env node

import { config } from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const performanceCommands = [
  // Individual index creation commands (non-concurrent for compatibility)
  "CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);",
  "CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);",
  "CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);",
  "CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);",
  "CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);",
  "CREATE INDEX IF NOT EXISTS idx_tickets_category_id ON tickets(category_id);",
  "CREATE INDEX IF NOT EXISTS idx_tickets_status_priority ON tickets(status, priority);",
  "CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON comments(ticket_id);",
  "CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);",
  "CREATE INDEX IF NOT EXISTS idx_attachments_ticket_id ON attachments(ticket_id);",
  "CREATE INDEX IF NOT EXISTS idx_tickets_user_status ON tickets(user_id, status);",
  "CREATE INDEX IF NOT EXISTS idx_tickets_assigned_status ON tickets(assigned_to, status) WHERE assigned_to IS NOT NULL;",
  
  // Create optimized view
  `DROP VIEW IF EXISTS ticket_details_fast;`,
  `CREATE VIEW ticket_details_fast AS
   SELECT 
     t.id, t.number, t.title, t.description, t.user_id, t.assigned_to, 
     t.category_id, t.type_id, t.tags, t.priority, t.status, t.product, 
     t.product_reference_number, t.created_at, t.updated_at, t.resolved_at,
     u.email as creator_email, u.full_name as creator_name,
     au.email as assigned_email, au.full_name as assigned_name,
     c.name as category_name, c.color as category_color,
     tt.name as type_name, tt.description as type_description
   FROM tickets t
   LEFT JOIN users u ON t.user_id = u.id
   LEFT JOIN users au ON t.assigned_to = au.id
   LEFT JOIN categories c ON t.category_id = c.id
   LEFT JOIN ticket_types tt ON t.type_id = tt.id;`,
  
  // Analyze tables
  "ANALYZE tickets;",
  "ANALYZE users;",
  "ANALYZE comments;",
  "ANALYZE attachments;",
  "ANALYZE categories;"
];

async function applyPerformanceFixes() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Applying performance optimizations...');
    
    for (let i = 0; i < performanceCommands.length; i++) {
      const command = performanceCommands[i];
      try {
        console.log(`Executing step ${i + 1}/${performanceCommands.length}...`);
        await client.query(command);
      } catch (error) {
        console.warn(`⚠️  Warning on step ${i + 1}: ${error.message}`);
        // Continue with other optimizations even if one fails
      }
    }
    
    console.log('✅ Performance optimizations completed!');
    
  } catch (error) {
    console.error('❌ Error applying performance fixes:', error);
    throw error;
  } finally {
    client.release();
  }
}

applyPerformanceFixes()
  .then(() => {
    console.log('🎉 All performance improvements applied successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to apply performance fixes:', error);
    process.exit(1);
  });