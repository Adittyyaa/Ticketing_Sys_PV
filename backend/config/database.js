import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const isProduction = process.env.NODE_ENV === 'production';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL environment variable is not set. Please set it in your .env file.'
  );
}

// Check if DATABASE_URL requires SSL (common with cloud providers like Neon, Heroku, etc.)
const requiresSSL = databaseUrl.includes('sslmode=require') || 
                   databaseUrl.includes('sslmode=verify-full') || 
                   isProduction;

const sslConfig = requiresSSL
  ? {
      require: true,
      // For development with cloud providers, you might want to set DB_SSL_REJECT_UNAUTHORIZED=false in .env
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    }
  : false;

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  dialectOptions: { ssl: sslConfig },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 20,        // Increased connection pool
    min: 5,         // Keep minimum connections warm
    acquire: 60000, // Longer acquire timeout
    idle: 300000,   // 5 minute idle timeout
  },
  define: {
    timestamps: true,
    underscored: false,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  },
});

export const safeQuery = async (text, params = []) => {
  try {
    const [results, metadata] = await sequelize.query(text, {
      bind: params,
      raw: true,
    });
    return { rows: results, metadata };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(' Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

export const checkConnection = testConnection;

export const closeConnection = async () => {
  await sequelize.close();
  console.log('Database connection pool closed.');
};

export default sequelize;
