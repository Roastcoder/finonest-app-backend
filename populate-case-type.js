import db from './src/config/database.js';

async function populateCaseType() {
  const client = await db.connect();
  try {
    console.log('Starting case_type population...\n');

    // Step 1: Check if case_type column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'loans' AND column_name = 'case_type'
    `);

    if (columnCheck.rows.length === 0) {
      console.log('❌ case_type column does not exist in loans table');
      console.log('Adding case_type column...');
      await client.query(`ALTER TABLE loans ADD COLUMN case_type VARCHAR(50)`);
      console.log('✅ case_type column added\n');
    } else {
      console.log('✅ case_type column exists\n');
    }

    // Step 2: Check current state
    const beforeCheck = await client.query(`
      SELECT 
        COUNT(*) as total_loans,
        COUNT(case_type) as with_case_type,
        COUNT(*) - COUNT(case_type) as missing_case_type
      FROM loans
    `);

    console.log('Before population:');
    console.log(`  Total loans: ${beforeCheck.rows[0].total_loans}`);
    console.log(`  With case_type: ${beforeCheck.rows[0].with_case_type}`);
    console.log(`  Missing case_type: ${beforeCheck.rows[0].missing_case_type}\n`);

    // Step 3: Populate case_type from leads
    if (beforeCheck.rows[0].missing_case_type > 0) {
      console.log('Populating case_type from leads...');
      const updateResult = await client.query(`
        UPDATE loans l
        SET case_type = lead.case_type
        FROM leads lead
        WHERE l.lead_id = lead.id
        AND l.case_type IS NULL
        AND lead.case_type IS NOT NULL
      `);

      console.log(`✅ Updated ${updateResult.rowCount} loans with case_type from leads\n`);
    }

    // Step 4: Handle loans without lead_id
    const orphanLoans = await client.query(`
      SELECT COUNT(*) as count
      FROM loans
      WHERE case_type IS NULL
      AND lead_id IS NULL
    `);

    if (orphanLoans.rows[0].count > 0) {
      console.log(`⚠️  Found ${orphanLoans.rows[0].count} loans without lead_id and case_type`);
      console.log('These loans need manual case_type assignment\n');
    }

    // Step 5: Check final state
    const afterCheck = await client.query(`
      SELECT 
        COUNT(*) as total_loans,
        COUNT(case_type) as with_case_type,
        COUNT(*) - COUNT(case_type) as missing_case_type
      FROM loans
    `);

    console.log('After population:');
    console.log(`  Total loans: ${afterCheck.rows[0].total_loans}`);
    console.log(`  With case_type: ${afterCheck.rows[0].with_case_type}`);
    console.log(`  Missing case_type: ${afterCheck.rows[0].missing_case_type}\n`);

    // Step 6: Show distribution of case types
    const distribution = await client.query(`
      SELECT case_type, COUNT(*) as count
      FROM loans
      WHERE case_type IS NOT NULL
      GROUP BY case_type
      ORDER BY count DESC
    `);

    if (distribution.rows.length > 0) {
      console.log('Case Type Distribution:');
      distribution.rows.forEach(row => {
        console.log(`  ${row.case_type || 'NULL'}: ${row.count}`);
      });
      console.log();
    }

    // Step 7: Show sample data
    const samples = await client.query(`
      SELECT id, loan_number, case_type, applicant_name
      FROM loans
      WHERE case_type IS NOT NULL
      LIMIT 5
    `);

    if (samples.rows.length > 0) {
      console.log('Sample loans with case_type:');
      samples.rows.forEach(row => {
        console.log(`  ${row.loan_number}: ${row.case_type} (${row.applicant_name})`);
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

populateCaseType();
