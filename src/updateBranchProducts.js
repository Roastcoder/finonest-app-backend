import db from './config/database.js';

const PRODUCTS = [
  'New Car - Purchase',
  'Used Car - Purchase',
  'Used Car - Refinance',
  'Used Car - Top-up',
  'Used Car - BT'
];

async function updateBranchProducts() {
  try {
    console.log('🔄 Starting to update branch products...\n');

    // Get all active branches
    const branchesResult = await db.query(
      `SELECT id, branch_name, bank_id FROM bank_branches WHERE status = 'active'`
    );

    const branches = branchesResult.rows;
    console.log(`📊 Found ${branches.length} active branches\n`);

    let updatedCount = 0;

    // Update each branch with all products
    for (const branch of branches) {
      const productString = PRODUCTS.join(', ');
      
      await db.query(
        `UPDATE bank_branches SET product = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [productString, branch.id]
      );

      updatedCount++;
      console.log(`✅ Updated: ${branch.branch_name} (ID: ${branch.id})`);
    }

    console.log(`\n✅ Successfully updated ${updatedCount} branches with all products`);
    console.log(`📋 Products added to each branch:`);
    PRODUCTS.forEach(p => console.log(`   • ${p}`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating branch products:', error);
    process.exit(1);
  }
}

updateBranchProducts();
