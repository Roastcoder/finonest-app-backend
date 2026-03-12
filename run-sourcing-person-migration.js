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
    
    const sql = fs.readFileSync(path.join(__dirname, 'add_sourcing_person_to_leads.sql'), 'utf8');
    
    console.log('Executing migration...');
    await client.query(sql);
    console.log('✓ Migration executed successfully!\n');
    
    console.log('=== VERIFICATION ===');
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'leads' 
      AND column_name = 'sourcing_person_name';
    `);
    
    if (result.rows.length > 0) {
      console.log('✓ Column added successfully:');
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log('⚠ Column not found');
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
