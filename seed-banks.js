import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function seedBanks() {
  try {
    console.log('Starting banks seed...');
    
    const sql = fs.readFileSync(path.join(__dirname, 'seed_banks.sql'), 'utf8');
    
    await pool.query(sql);
    
    console.log('✓ Banks seeded successfully!');
    
    const result = await pool.query('SELECT COUNT(*) FROM banks');
    console.log(`Total banks in database: ${result.rows[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding banks:', error);
    process.exit(1);
  }
}

seedBanks();
