import db from './src/config/database.js';

async function checkAndFixLeadsTable() {
  try {
    console.log('Checking leads table structure...');
    
    // Check if leads table exists and get its columns
    const columnsResult = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'leads'
      ORDER BY ordinal_position
    `);
    
    console.log('Current leads table columns:');
    columnsResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    
    // Check for required columns and add them if missing
    const requiredColumns = [
      { name: 'application_stage', type: 'VARCHAR(20)', default: "'SUBMITTED'" },
      { name: 'stage_data', type: 'JSONB', default: null },
      { name: 'stage_history', type: 'JSONB[]', default: null },
      { name: 'stage_changed_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
    ];
    
    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        console.log(`Adding missing column: ${column.name}`);
        const alterQuery = `ALTER TABLE leads ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}${column.default ? ` DEFAULT ${column.default}` : ''}`;
        await db.query(alterQuery);
        console.log(`✓ Added column: ${column.name}`);
      } else {
        console.log(`✓ Column exists: ${column.name}`);
      }
    }
    
    // Update existing leads to have SUBMITTED stage if null
    const updateResult = await db.query(`
      UPDATE leads 
      SET application_stage = 'SUBMITTED' 
      WHERE application_stage IS NULL
    `);
    
    console.log(`Updated ${updateResult.rowCount} leads with default application_stage`);
    
    // Test the query that was failing
    console.log('Testing leads query...');
    const testResult = await db.query(`
      SELECT l.id, l.customer_name, 
             COALESCE(l.application_stage, 'SUBMITTED') as application_stage,
             l.stage_data,
             l.stage_history
      FROM leads l
      LIMIT 5
    `);
    
    console.log(`✓ Query successful, returned ${testResult.rows.length} rows`);
    
    console.log('Leads table structure check completed successfully!');
    
  } catch (error) {
    console.error('Error checking leads table:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

checkAndFixLeadsTable();