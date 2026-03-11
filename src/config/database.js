import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Ensure we have the required environment variables
if (!process.env.DATABASE_URL && (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME)) {
  console.error('❌ Missing required database configuration');
  console.error('Required: DATABASE_URL or (DB_HOST, DB_USER, DB_NAME)');
  process.exit(1);
}

// Create pool with explicit configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Fallback to individual parameters if connectionString fails
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false,
  // Connection pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client:', err.message);
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Connection details:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      hasPassword: !!process.env.DB_PASSWORD,
      connectionString: process.env.DATABASE_URL ? 'Present' : 'Missing'
    });
  } else {
    console.log('✅ Database connected successfully to:', process.env.DB_HOST || 'connection string');
    release();
  }
});

export default pool;
