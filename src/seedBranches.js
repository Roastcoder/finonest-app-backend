import pool from './config/database.js';

const seedBranchesWithCoordinates = async () => {
  const client = await pool.connect();

  try {
    console.log('🌱 Seeding bank branches with coordinates...');

    // Get bank IDs
    const banksResult = await client.query(`
      SELECT id, name FROM banks WHERE status = 'active' LIMIT 4
    `);

    if (banksResult.rows.length === 0) {
      console.log('❌ No banks found. Please seed banks first.');
      return;
    }

    const banks = banksResult.rows;
    console.log(`Found ${banks.length} banks`);

    // Sample branches in Jaipur with coordinates
    const branches = [
      {
        bank_name: 'HDFC Bank',
        branch_name: 'HDFC Bank - Tonk Road',
        location: 'Tonk Road, Jaipur',
        latitude: 26.8520,
        longitude: 75.7950,
        geo_limit: '50km',
        product: 'purchase,refinance,bt',
        sales_manager_name: 'Rajesh Kumar',
        sales_manager_mobile: '9876543210',
        area_sales_manager_name: 'Priya Singh',
        area_sales_manager_mobile: '9876543211'
      },
      {
        bank_name: 'ICICI Bank',
        branch_name: 'ICICI Bank - C-Scheme',
        location: 'C-Scheme, Jaipur',
        latitude: 26.9124,
        longitude: 75.7873,
        geo_limit: '50km',
        product: 'purchase,refinance',
        sales_manager_name: 'Amit Patel',
        sales_manager_mobile: '9876543212',
        area_sales_manager_name: 'Neha Sharma',
        area_sales_manager_mobile: '9876543213'
      },
      {
        bank_name: 'SBI',
        branch_name: 'SBI - Jaipur City Center',
        location: 'City Center, Jaipur',
        latitude: 26.9124,
        longitude: 75.8124,
        geo_limit: '50km',
        product: 'purchase,bt',
        sales_manager_name: 'Vikram Singh',
        sales_manager_mobile: '9876543214',
        area_sales_manager_name: 'Anjali Verma',
        area_sales_manager_mobile: '9876543215'
      },
      {
        bank_name: 'Axis Bank',
        branch_name: 'Axis Bank - Malviya Nagar',
        location: 'Malviya Nagar, Jaipur',
        latitude: 26.8750,
        longitude: 75.8250,
        geo_limit: '50km',
        product: 'purchase,refinance,bt',
        sales_manager_name: 'Suresh Gupta',
        sales_manager_mobile: '9876543216',
        area_sales_manager_name: 'Divya Nair',
        area_sales_manager_mobile: '9876543217'
      }
    ];

    for (const branch of branches) {
      const bank = banks.find(b => b.name.includes(branch.bank_name.split(' ')[0]));
      if (!bank) {
        console.log(`⚠️  Bank not found for ${branch.bank_name}`);
        continue;
      }

      await client.query(`
        INSERT INTO bank_branches 
        (bank_id, branch_name, location, latitude, longitude, geo_limit, product, 
         sales_manager_name, sales_manager_mobile, area_sales_manager_name, 
         area_sales_manager_mobile, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
        ON CONFLICT DO NOTHING
      `, [
        bank.id,
        branch.branch_name,
        branch.location,
        branch.latitude,
        branch.longitude,
        branch.geo_limit,
        branch.product,
        branch.sales_manager_name,
        branch.sales_manager_mobile,
        branch.area_sales_manager_name,
        branch.area_sales_manager_mobile
      ]);

      console.log(`✅ Added: ${branch.branch_name}`);
    }

    console.log('\n✅ Branches seeded successfully!');
    console.log('📍 Test address: Jaipur Hospital, Tonk Road, Jaipur');
    
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

seedBranchesWithCoordinates();
