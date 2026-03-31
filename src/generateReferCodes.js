import db from './config/database.js';

const generateReferCodesForExisting = async () => {
  try {
    console.log('🔄 Generating refer codes for existing team leaders, branch managers, and DSAs...');
    
    const usersResult = await db.query(`
      SELECT id, full_name, role FROM users 
      WHERE role IN ('team_leader', 'branch_manager', 'dsa') AND refer_code IS NULL
    `);
    
    console.log(`Found ${usersResult.rows.length} users without refer codes`);
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let updatedCount = 0;
    
    for (const user of usersResult.rows) {
      let referCode = '';
      let isUnique = false;
      
      while (!isUnique) {
        referCode = '';
        for (let i = 0; i < 8; i++) {
          referCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        const existingCode = await db.query(
          'SELECT id FROM users WHERE refer_code = $1',
          [referCode]
        );
        
        if (existingCode.rows.length === 0) {
          isUnique = true;
        }
      }
      
      await db.query(
        'UPDATE users SET refer_code = $1 WHERE id = $2',
        [referCode, user.id]
      );
      
      console.log(`✅ Generated refer code for ${user.full_name} (${user.role}): ${referCode}`);
      updatedCount++;
    }
    
    console.log(`\n✅ Successfully generated refer codes for ${updatedCount} users!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

generateReferCodesForExisting();
