import db from './src/config/database.js';

async function populateLandmark() {
  const client = await db.connect();
  try {
    console.log('Starting landmark population...\n');

    // Step 1: Check if current_landmark column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'loans' AND column_name = 'current_landmark'
    `);

    if (columnCheck.rows.length === 0) {
      console.log('Adding current_landmark column...');
      await client.query(`ALTER TABLE loans ADD COLUMN current_landmark VARCHAR(255)`);
      console.log('✅ current_landmark column added\n');
    } else {
      console.log('✅ current_landmark column exists\n');
    }

    // Step 2: Check current state
    const beforeCheck = await client.query(`
      SELECT 
        COUNT(*) as total_loans,
        COUNT(current_landmark) as with_landmark,
        COUNT(*) - COUNT(current_landmark) as missing_landmark
      FROM loans
    `);

    console.log('Before population:');
    console.log(`  Total loans: ${beforeCheck.rows[0].total_loans}`);
    console.log(`  With landmark: ${beforeCheck.rows[0].with_landmark}`);
    console.log(`  Missing landmark: ${beforeCheck.rows[0].missing_landmark}\n`);

    // Step 3: Check what columns exist in leads table
    const leadsColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'leads'
      AND column_name LIKE '%landmark%'
      ORDER BY column_name
    `);
    
    console.log('Landmark-related columns in leads table:');
    if (leadsColumns.rows.length === 0) {
      console.log('  ❌ No landmark columns found in leads table');
    } else {
      leadsColumns.rows.forEach(col => console.log(`  - ${col.column_name}`));
    }
    console.log();

    // Step 4: Clear any address data that was incorrectly populated
    console.log('Clearing incorrectly populated address data from landmark...');
    const clearResult = await client.query(`
      UPDATE loans
      SET current_landmark = NULL
      WHERE current_landmark IS NOT NULL
      AND current_landmark = (SELECT current_address FROM leads WHERE leads.id = loans.lead_id LIMIT 1)
    `);
    console.log(`✅ Cleared ${clearResult.rowCount} incorrect entries\n`);

    // Step 5: Try to populate from leads if landmark column exists
    if (beforeCheck.rows[0].missing_landmark > 0) {
      console.log('Attempting to populate landmark from leads...');
      
      try {
        const updateFromLeads = await client.query(`
          UPDATE loans l
          SET current_landmark = lead.current_landmark
          FROM leads lead
          WHERE l.lead_id = lead.id
          AND l.current_landmark IS NULL
          AND lead.current_landmark IS NOT NULL
        `);
        
        if (updateFromLeads.rowCount > 0) {
          console.log(`✅ Updated ${updateFromLeads.rowCount} loans with landmark from leads\n`);
        } else {
          console.log('⚠️  No landmark data found in leads table');
          console.log('Landmark field will remain empty until data is added\n');
        }
      } catch (err) {
        console.log('⚠️  Landmark column does not exist in leads table');
        console.log('Landmark field will remain empty until data is added\n');
      }
    }

    // Step 6: Check final state
    const afterCheck = await client.query(`
      SELECT 
        COUNT(*) as total_loans,
        COUNT(current_landmark) as with_landmark,
        COUNT(*) - COUNT(current_landmark) as missing_landmark
      FROM loans
    `);

    console.log('After population:');
    console.log(`  Total loans: ${afterCheck.rows[0].total_loans}`);
    console.log(`  With landmark: ${afterCheck.rows[0].with_landmark}`);
    console.log(`  Missing landmark: ${afterCheck.rows[0].missing_landmark}\n`);

    // Step 7: Show sample data
    const samples = await client.query(`
      SELECT id, loan_number, current_landmark, applicant_name
      FROM loans
      WHERE current_landmark IS NOT NULL
      LIMIT 5
    `);

    if (samples.rows.length > 0) {
      console.log('Sample loans with landmark:');
      samples.rows.forEach(row => {
        console.log(`  ${row.loan_number}: ${row.current_landmark} (${row.applicant_name})`);
      });
      console.log();
    }

    console.log('✅ Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during migration:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
  }
}

populateLandmark();
