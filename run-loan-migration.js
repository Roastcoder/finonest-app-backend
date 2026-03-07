import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Running loan table schema updates...');
    
    const sqlFile = fs.readFileSync('schema_updates_loan_fix.sql', 'utf8');
    await client.query(sqlFile);
    
    console.log('✅ Loan table schema updates completed successfully!');
  } catch (error) {
    console.error('❌ Error running migration:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
