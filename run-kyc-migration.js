import db from './src/config/database.js';
import fs from 'fs';
import path from 'path';

async function runKycMigration() {
  try {
    console.log('Running KYC fields migration...');
    
    const migrationSQL = fs.readFileSync(path.join(process.cwd(), 'add_kyc_fields.sql'), 'utf8');
    
    await db.query(migrationSQL);
    
    console.log('✅ KYC fields migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ KYC fields migration failed:', error);
    process.exit(1);
  }
}

runKycMigration();