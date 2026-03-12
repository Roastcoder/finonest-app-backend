import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || '72.61.238.231',
  port: parseInt(process.env.DB_PORT) || 3000,
  database: process.env.DB_NAME || 'board',
  user: process.env.DB_USER || 'Board',
  password: process.env.DB_PASSWORD || 'Sanam@28',
  ssl: false
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting vehicle fields migration...');
    
    const sql = fs.readFileSync(path.join(__dirname, 'add_vehicle_fields.sql'), 'utf8');
    await client.query(sql);
    
    console.log('✓ Vehicle fields migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
