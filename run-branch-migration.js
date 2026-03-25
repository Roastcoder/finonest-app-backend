import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });

async function migrate() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'add_bank_branches.sql'), 'utf8');
    await pool.query(sql);
    console.log('✓ bank_branches table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();
