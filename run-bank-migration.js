import pool from './src/config/database.js';
import fs from 'fs';

async function runMigration() {
  try {
    const sql = fs.readFileSync('./add_bank_management_fields.sql', 'utf8');
    await pool.query(sql);
    console.log('✅ Bank management fields migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

runMigration();