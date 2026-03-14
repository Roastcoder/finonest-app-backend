import db from './src/config/database.js';
import fs from 'fs';
import path from 'path';

async function addLandmarkToLeads() {
  const client = await db.connect();
  try {
    console.log('Adding landmark column to leads table...\n');

    // Step 1: Check if current_landmark column exists in leads table
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'leads' AND column_name = 'current_landmark'
    `);

    if (columnCheck.rows.length === 0) {
      console.log('Adding current_landmark column to leads table...');
      await client.query(`ALTER TABLE leads ADD COLUMN current_landmark VARCHAR(255)`);
      console.log('✅ current_landmark column added to leads table\n');
    } else {
      console.log('✅ current_landmark column already exists in leads table\n');
    }

    // Step 2: Check current state
    const beforeCheck = await client.query(`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(current_landmark) as with_landmark,
        COUNT(*) - COUNT(current_landmark) as missing_landmark
      FROM leads
    `);

    console.log('Current state:');
    console.log(`  Total leads: ${beforeCheck.rows[0].total_leads}`);
    console.log(`  With landmark: ${beforeCheck.rows[0].with_landmark}`);
    console.log(`  Missing landmark: ${beforeCheck.rows[0].missing_landmark}\n`);

    // Step 3: Show table structure
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'leads' 
      ORDER BY ordinal_position
    `);

    console.log('Leads table structure:');
    structure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    console.log();

    console.log('✅ Migration completed successfully!');
    console.log('The landmark field will now be available in the loan application form.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during migration:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
  }
}

addLandmarkToLeads();