import { Sequelize } from 'sequelize';
import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
const loadEnvFile = () => {
  const envPath = join(__dirname, '../../../.env');
  if (existsSync(envPath)) {
    try {
      const envContent = readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          const value = valueParts.join('=');
          if (key && !process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    } catch (error) {
      console.warn('Could not load .env file:', error.message);
    }
  }
};

// Load environment variables
loadEnvFile();

// Get database URL with fallback
const getDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn('DATABASE_URL environment variable is not set. Using fallback connection string.');
    console.warn('Please set DATABASE_URL in your .env file for proper database connection.');
    return 'postgresql://placeholder_user:placeholder_password@localhost:5432/placeholder_db';
  }
  return dbUrl;
};

// Initialize PostgreSQL client pool for raw queries
const pool = new pg.Pool({
  connectionString: getDatabaseUrl(),
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

// Safe query function for raw SQL
export const safeQuery = async (text, params = []) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Initialize Sequelize instance
const sequelize = new Sequelize(getDatabaseUrl(), {
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: false, // Using camelCase for field names to match Budget model pattern
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt'
  }
});

// Test the connection
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
};

// Alias for server.js compatibility
export const checkConnection = testConnection;

export default sequelize;
