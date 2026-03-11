import db from './src/config/database.js';

async function migrate() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        console.log('Starting Phase 3 Migration...');

        // 1. Alter Leads table
        console.log('Adding stage-specific fields to leads table...');
        await client.query(`
      ALTER TABLE leads 
        ADD COLUMN IF NOT EXISTS app_score NUMERIC(5,2),
        ADD COLUMN IF NOT EXISTS credit_score INTEGER,
        ADD COLUMN IF NOT EXISTS rc_type VARCHAR(50),
        ADD COLUMN IF NOT EXISTS rc_collected_by VARCHAR(50);
    `);

        // 2. Create customer_profiles table
        console.log('Creating customer_profiles table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS customer_profiles (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        profile_type VARCHAR(50) NOT NULL, -- 'salaried', 'self_employed'
        sub_type VARCHAR(100), -- 'business', 'professional', 'freelancer', 'farmer', 'other'
        
        -- Salaried fields
        company_name VARCHAR(255),
        designation VARCHAR(255),
        current_job_experience_years NUMERIC(5,2),
        total_work_experience_years NUMERIC(5,2),
        net_monthly_salary NUMERIC(15,2),
        salary_credit_mode VARCHAR(100), -- 'account_transfer', 'cash'
        salary_slip_available BOOLEAN,
        
        -- Self Employed fields
        business_name VARCHAR(255),
        business_vintage_years NUMERIC(5,2),
        professional_type VARCHAR(100), -- 'ca', 'doctor', 'engineer', 'architect'
        doctor_specialty VARCHAR(100), -- 'mbbs', 'md_ms', 'bds_mds'
        freelancer_type VARCHAR(100), -- 'it', 'lic_agent', 'property_broker', 'gig_worker', 'commission_agent'
        practice_experience_years NUMERIC(5,2),
        
        -- Shared Income fields
        itr_available BOOLEAN,
        annual_income NUMERIC(15,2),
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT unique_lead_profile UNIQUE(lead_id)
      );
    `);

        await client.query('COMMIT');
        console.log('Migration successful!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
    } finally {
        client.release();
        process.exit(0);
    }
}

migrate();
