import db from './src/config/database.js';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    console.log('Running database migration for application stages...');
    
    const migrationSQL = fs.readFileSync(
      path.join(process.cwd(), 'migrations', 'add_application_stages.sql'), 
      'utf8'
    );
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== 'COMMIT');
    
    for (const statement of statements) {
      if (statement) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        await db.query(statement);
      }
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();