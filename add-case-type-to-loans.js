import db from './src/config/database.js';

async function addCaseTypeToLoans() {
  const client = await db.connect();
  try {
    console.log('Adding case_type column to loans table...\n');

    // Step 1: Check if case_type column exists in loans table
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'loans' AND column_name = 'case_type'
    `);

    if (columnCheck.rows.length === 0) {
      console.log('Adding case_type column to loans table...');
      await client.query(`ALTER TABLE loans ADD COLUMN case_type VARCHAR(50)`);
      console.log('✅ case_type column added to loans table\n');
    } else {
      console.log('✅ case_type column already exists in loans table\n');
    }

    // Step 2: Check current state
    const beforeCheck = await client.query(`
      SELECT 
        COUNT(*) as total_loans,
        COUNT(case_type) as with_case_type,
        COUNT(*) - COUNT(case_type) as missing_case_type
      FROM loans
    `);

    console.log('Current state:');
    console.log(`  Total loans: ${beforeCheck.rows[0].total_loans}`);
    console.log(`  With case_type: ${beforeCheck.rows[0].with_case_type}`);
    console.log(`  Missing case_type: ${beforeCheck.rows[0].missing_case_type}\n`);

    // Step 3: Try to populate case_type from related leads
    if (beforeCheck.rows[0].missing_case_type > 0) {
      console.log('Attempting to populate case_type from related leads...');
      
      try {
        const updateFromLeads = await client.query(`
          UPDATE loans l
          SET case_type = lead.case_type
          FROM leads lead
          WHERE l.lead_id = lead.id
          AND l.case_type IS NULL
          AND lead.case_type IS NOT NULL
        `);
        
        if (updateFromLeads.rowCount > 0) {
          console.log(`✅ Updated ${updateFromLeads.rowCount} loans with case_type from leads\n`);
        } else {
          console.log('⚠️  No case_type data found in related leads');
          console.log('Case_type field will remain empty until new loans are created\n');
        }
      } catch (err) {
        console.log('⚠️  Could not populate from leads:', err.message);
        console.log('Case_type field will remain empty until new loans are created\n');
      }
    }

    // Step 4: Check final state
    const afterCheck = await client.query(`
      SELECT 
        COUNT(*) as total_loans,
        COUNT(case_type) as with_case_type,
        COUNT(*) - COUNT(case_type) as missing_case_type
      FROM loans
    `);

    console.log('After migration:');
    console.log(`  Total loans: ${afterCheck.rows[0].total_loans}`);
    console.log(`  With case_type: ${afterCheck.rows[0].with_case_type}`);
    console.log(`  Missing case_type: ${afterCheck.rows[0].missing_case_type}\n`);

    // Step 5: Show table structure
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'loans' 
      ORDER BY ordinal_position
    `);

    console.log('Loans table structure:');
    structure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    console.log();

    console.log('✅ Migration completed successfully!');
    console.log('The case_type field will now be saved when creating new loans.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during migration:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
  }
}

addCaseTypeToLoans();