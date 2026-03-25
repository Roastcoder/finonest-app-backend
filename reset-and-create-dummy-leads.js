import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false
});

async function resetLeads() {
  const client = await pool.connect();
  try {
    console.log('🗑️  Deleting all existing leads...');
    
    // Delete all leads
    const deleteResult = await client.query('DELETE FROM leads');
    console.log(`✅ Deleted ${deleteResult.rowCount} leads`);
    
    console.log('\n📝 Creating 4 dummy leads...');
    
    // Get first user ID for created_by and assigned_to
    const userResult = await client.query('SELECT id FROM users ORDER BY id LIMIT 1');
    const userId = userResult.rows[0]?.id || 1;
    
    // Get first bank ID for financier_id
    const bankResult = await client.query('SELECT id FROM banks ORDER BY id LIMIT 1');
    const bankId = bankResult.rows[0]?.id || null;
    
    const dummyLeads = [
      {
        customer_id: 'RAJ001',
        customer_name: 'Rajesh Kumar',
        phone: '9876543210',
        email: 'rajesh@example.com',
        current_address: '123 MG Road, Jaipur',
        pincode: '302001',
        city: 'Jaipur',
        state: 'Rajasthan',
        pan_number: 'ABCDE1234F',
        vehicle_number: 'RJ14AB1234',
        loan_amount_required: 500000,
        case_type: 'new',
        lead_type: 'hot',
        application_stage: 'SUBMITTED',
        stage_data: {
          stage: 'SUBMITTED',
          submittedAt: new Date().toISOString(),
          submittedBy: userId
        },
        stage_history: [{
          stage: 'SUBMITTED',
          submittedAt: new Date().toISOString(),
          submittedBy: userId,
          action: 'Lead created'
        }],
        converted_to_loan: false,
        stage: 'lead',
        status: 'new',
        source: 'Website',
        notes: 'Interested in vehicle loan'
      },
      {
        customer_id: 'PRI002',
        customer_name: 'Priya Sharma',
        phone: '9876543211',
        email: 'priya@example.com',
        current_address: '456 Park Street, Delhi',
        pincode: '110001',
        city: 'Delhi',
        state: 'Delhi',
        pan_number: 'FGHIJ5678K',
        vehicle_number: 'DL01CD5678',
        loan_amount_required: 750000,
        case_type: 'refinance',
        lead_type: 'warm',
        application_stage: 'SUBMITTED',
        stage_data: {
          stage: 'SUBMITTED',
          submittedAt: new Date().toISOString(),
          submittedBy: userId
        },
        stage_history: [{
          stage: 'SUBMITTED',
          submittedAt: new Date().toISOString(),
          submittedBy: userId,
          action: 'Lead created'
        }],
        converted_to_loan: false,
        stage: 'lead',
        status: 'new',
        source: 'Referral',
        notes: 'Looking for better interest rates'
      },
      {
        customer_id: 'AMI003',
        customer_name: 'Amit Patel',
        phone: '9876543212',
        email: 'amit@example.com',
        current_address: '789 Station Road, Mumbai',
        pincode: '400001',
        city: 'Mumbai',
        state: 'Maharashtra',
        pan_number: 'LMNOP9012Q',
        vehicle_number: 'MH02EF9012',
        loan_amount_required: 600000,
        case_type: 'new',
        lead_type: 'hot',
        application_stage: 'SUBMITTED',
        stage_data: {
          stage: 'SUBMITTED',
          submittedAt: new Date().toISOString(),
          submittedBy: userId
        },
        stage_history: [{
          stage: 'SUBMITTED',
          submittedAt: new Date().toISOString(),
          submittedBy: userId,
          action: 'Lead created'
        }],
        converted_to_loan: false,
        stage: 'lead',
        status: 'new',
        source: 'Walk-in',
        notes: 'Urgent requirement'
      },
      {
        customer_id: 'SUN004',
        customer_name: 'Sunita Verma',
        phone: '9876543213',
        email: 'sunita@example.com',
        current_address: '321 Lake View, Bangalore',
        pincode: '560001',
        city: 'Bangalore',
        state: 'Karnataka',
        pan_number: 'RSTUV3456W',
        vehicle_number: 'KA03GH3456',
        loan_amount_required: 450000,
        case_type: 'balance_transfer',
        lead_type: 'cold',
        application_stage: 'SUBMITTED',
        stage_data: {
          stage: 'SUBMITTED',
          submittedAt: new Date().toISOString(),
          submittedBy: userId
        },
        stage_history: [{
          stage: 'SUBMITTED',
          submittedAt: new Date().toISOString(),
          submittedBy: userId,
          action: 'Lead created'
        }],
        converted_to_loan: false,
        stage: 'lead',
        status: 'new',
        source: 'Phone Call',
        notes: 'Comparing options'
      }
    ];
    
    for (let i = 0; i < dummyLeads.length; i++) {
      const lead = dummyLeads[i];
      
      // Add common fields
      lead.assigned_to = userId;
      lead.created_by = userId;
      lead.sourcing_person_name = 'Admin User';
      if (bankId) lead.financier_id = bankId;
      
      const keys = Object.keys(lead);
      const values = Object.values(lead);
      const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');
      
      const result = await client.query(
        `INSERT INTO leads (${keys.join(', ')}) VALUES (${placeholders}) RETURNING id, customer_id, customer_name`,
        values
      );
      
      console.log(`✅ Created lead ${i + 1}: ${result.rows[0].customer_name} (ID: ${result.rows[0].customer_id})`);
    }
    
    console.log('\n🎉 Successfully created 4 dummy leads!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

resetLeads();
