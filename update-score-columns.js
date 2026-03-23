import db from './src/config/database.js';

async function updateScoreColumns() {
  try {
    console.log('Checking app_score and credit_score columns...');
    
    // Check current column types
    const columns = await db.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'loans' 
      AND column_name IN ('app_score', 'credit_score')
      ORDER BY column_name
    `);
    
    console.log('Current score columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.character_maximum_length || 'no limit'})`);
    });
    
    // Update columns to support alphanumeric values
    const updates = [
      'ALTER TABLE loans ALTER COLUMN app_score TYPE VARCHAR(50)',
      'ALTER TABLE loans ALTER COLUMN credit_score TYPE VARCHAR(50)'
    ];
    
    for (const query of updates) {
      try {
        await db.query(query);
        const columnName = query.split('ALTER COLUMN ')[1].split(' ')[0];
        console.log(`✅ ${columnName} updated to VARCHAR(50)`);
      } catch (error) {
        if (error.code === '42804') {
          console.log(`⚠️ Column already supports text or conversion needed`);
        } else {
          console.log(`❌ Error updating column: ${error.message}`);
        }
      }
    }
    
    // Check final column types
    const finalColumns = await db.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'loans' 
      AND column_name IN ('app_score', 'credit_score')
      ORDER BY column_name
    `);
    
    console.log('\\nFinal score columns:');
    finalColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.character_maximum_length || 'no limit'})`);
    });
    
    console.log('\\n✅ Score columns updated to support alphanumeric values!');
    
  } catch (error) {
    console.error('Error updating score columns:', error.message);
  }
}

updateScoreColumns();