import pg from 'pg';
import fs from 'fs';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgres://Board:Sanam%4028@72.61.238.231:3000/board',
  ssl: false
});

async function runMigration() {
  try {
    console.log('Connecting to database...');
    const sql = fs.readFileSync('./migration_add_user_fields.sql', 'utf8');
    console.log('Running migration...');
    await pool.query(sql);
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
