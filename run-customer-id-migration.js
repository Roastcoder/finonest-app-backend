import { Client } from 'pg';
import fs from 'fs';

const client = new Client({
  connectionString: 'postgres://Board:Sanam%4028@72.61.238.231:3000/board'
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to database');

    const migration = fs.readFileSync('./migration_add_customer_id.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migration.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        await client.query(statement);
      }
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration();