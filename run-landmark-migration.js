import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  host: '72.61.238.231',
  port: 3000,
  database: 'board',
  user: 'Board',
  password: 'Sanam@28',
  ssl: false,
  connectionTimeoutMillis: 30000,
});

async function runMigration() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected to database\n');
    
    const sql = fs.readFileSync(path.join(__dirname, 'add_landmark_columns.sql'), 'utf8');
    
    console.log('Executing migration...');
    await client.query(sql);
    console.log('✓ Migration executed successfully!\n');
    
    // Verify columns were added
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'loans' 
      AND column_name IN ('current_landmark', 'permanent_landmark')
      ORDER BY column_name;
    `);
    
    console.log('=== VERIFICATION ===');
    if (result.rows.length > 0) {
      console.log('✓ Columns added successfully:');
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log('⚠ No columns found - they may already exist');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✓ Database connection closed');
  }
}

runMigration();
