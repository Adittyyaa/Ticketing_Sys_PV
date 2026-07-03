#!/usr/bin/env node

import { config } from 'dotenv';
import pg from 'pg';

config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

const performanceTests = [
  {
    name: 'Ticket List Query (Fast View)',
    query: `SELECT * FROM ticket_details_fast ORDER BY created_at DESC LIMIT 50`
  },
  {
    name: 'Ticket List Query (Original View)',
    query: `SELECT * FROM ticket_details ORDER BY created_at DESC LIMIT 50`
  },
  {
    name: 'Dashboard Stats Query',
    query: `
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(*) FILTER (WHERE status = 'UNTOUCHED') as untouched_tickets,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending_tickets,
        COUNT(*) FILTER (WHERE status = 'SOLVED') as solved_tickets
      FROM tickets
    `
  },
  {
    name: 'Category Breakdown',
    query: `
      SELECT c.name, COUNT(t.id) as ticket_count
      FROM categories c
      LEFT JOIN tickets t ON c.id = t.category_id
      GROUP BY c.id, c.name
      ORDER BY ticket_count DESC
    `
  },
  {
    name: 'Recent Tickets with User Info',
    query: `
      SELECT t.*, u.full_name as creator_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY t.created_at DESC
      LIMIT 20
    `
  }
];

async function runPerformanceTest(test) {
  const client = await pool.connect();
  
  try {
    const startTime = process.hrtime.bigint();
    const result = await client.query(test.query);
    const endTime = process.hrtime.bigint();
    
    const executionTimeMs = Number(endTime - startTime) / 1000000;
    
    return {
      name: test.name,
      executionTime: `${executionTimeMs.toFixed(2)}ms`,
      rows: result.rows.length,
      status: 'success'
    };
  } catch (error) {
    return {
      name: test.name,
      executionTime: 'FAILED',
      rows: 0,
      status: 'error',
      error: error.message
    };
  } finally {
    client.release();
  }
}

async function checkDatabaseHealth() {
  const client = await pool.connect();
  
  try {
    // Check connection count
    const connectionResult = await client.query(`
      SELECT COUNT(*) as active_connections 
      FROM pg_stat_activity 
      WHERE state = 'active'
    `);
    
    // Check index usage
    const indexResult = await client.query(`
      SELECT 
        schemaname,
        tablename,
        attname as column_name,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public' 
        AND tablename IN ('tickets', 'users', 'comments')
      ORDER BY tablename, attname
      LIMIT 10
    `);
    
    // Check slow queries (if enabled)
    const slowQueriesResult = await client.query(`
      SELECT query, calls, total_exec_time, mean_exec_time
      FROM pg_stat_statements 
      WHERE query LIKE '%tickets%' OR query LIKE '%users%'
      ORDER BY mean_exec_time DESC
      LIMIT 5
    `).catch(() => ({ rows: [] })); // Might not be enabled
    
    return {
      activeConnections: connectionResult.rows[0].active_connections,
      indexStats: indexResult.rows,
      slowQueries: slowQueriesResult.rows
    };
    
  } catch (error) {
    return {
      error: error.message
    };
  } finally {
    client.release();
  }
}

async function main() {
  console.log('🏃‍♂️ Running Performance Tests...\n');
  
  const results = [];
  
  for (const test of performanceTests) {
    console.log(`Testing: ${test.name}...`);
    const result = await runPerformanceTest(test);
    results.push(result);
    
    if (result.status === 'success') {
      console.log(`✅ ${result.executionTime} (${result.rows} rows)\n`);
    } else {
      console.log(`❌ FAILED: ${result.error}\n`);
    }
  }
  
  console.log('📊 Performance Test Results:');
  console.log('================================');
  results.forEach(result => {
    const status = result.status === 'success' ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.executionTime}`);
  });
  
  console.log('\n🔍 Database Health Check:');
  console.log('================================');
  const health = await checkDatabaseHealth();
  
  if (health.error) {
    console.log(`❌ Health check failed: ${health.error}`);
  } else {
    console.log(`🔗 Active Connections: ${health.activeConnections}`);
    
    if (health.slowQueries.length > 0) {
      console.log('\n🐌 Potential Slow Queries:');
      health.slowQueries.forEach(query => {
        console.log(`- Avg Time: ${parseFloat(query.mean_exec_time).toFixed(2)}ms`);
        console.log(`  Calls: ${query.calls}`);
        console.log(`  Query: ${query.query.substring(0, 80)}...`);
      });
    }
  }
  
  console.log('\n💡 Performance Tips:');
  console.log('- Fast queries should be under 50ms');
  console.log('- Complex queries should be under 200ms');
  console.log('- Watch for queries over 500ms');
  console.log('- Keep active connections under 80% of pool size');
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Performance test failed:', error);
  process.exit(1);
});