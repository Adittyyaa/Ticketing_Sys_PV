import { Pool, QueryResult, PoolClient, QueryResultRow } from 'pg'

const connectionString = process.env.DATABASE_URL

// PostgreSQL connection pool configuration
export const pool = new Pool({
  connectionString: connectionString || 'postgresql://placeholder_user:placeholder_password@localhost:5432/placeholder_db',
  ssl: connectionString ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

function verifyDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
}

// Generic query function with type safety
export async function query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  verifyDatabaseUrl()
  const client = await pool.connect()
  try {
    const result = await client.query<T>(text, params)
    return result
  } finally {
    client.release()
  }
}

// Get a client for transactions
export async function getClient(): Promise<PoolClient> {
  verifyDatabaseUrl()
  return await pool.connect()
}

// Transaction helper function
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  verifyDatabaseUrl()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Helper function for parameterized queries with logging in development
export async function safeQuery<T extends QueryResultRow = any>(
  text: string, 
  params: any[] = [], 
  logQuery = process.env.NODE_ENV === 'development'
): Promise<QueryResult<T>> {
  if (logQuery) {
    console.log('Executing query:', text)
    console.log('Parameters:', params)
  }
  
  return query<T>(text, params)
}

// Database health check
export async function checkConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT 1 as health_check')
    return result.rows[0].health_check === 1
  } catch (error) {
    console.error('Database connection check failed:', error)
    return false
  }
}

// Graceful shutdown
export async function closePool(): Promise<void> {
  await pool.end()
}

export default pool