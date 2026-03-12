import db from './src/config/database.js';

const runLoanApplicationStageMigration = async () => {
  const client = await db.connect();
  
  try {
    console.log('Starting loan application stage migration...');
    
    // Add application stage columns to loans table
    await client.query(`
      ALTER TABLE loans 
      ADD COLUMN IF NOT EXISTS application_stage VARCHAR(20) DEFAULT 'SUBMITTED',
      ADD COLUMN IF NOT EXISTS stage_data JSONB,
      ADD COLUMN IF NOT EXISTS stage_history JSONB[],
      ADD COLUMN IF NOT EXISTS stage_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('✅ Added basic application stage columns');
    
    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_loans_application_stage ON loans(application_stage)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_loans_stage_changed_at ON loans(stage_changed_at)`);
    console.log('✅ Created indexes');
    
    // Update existing loans
    const updateResult = await client.query(`
      UPDATE loans 
      SET application_stage = 'SUBMITTED' 
      WHERE application_stage IS NULL
    `);
    console.log(`✅ Updated ${updateResult.rowCount} existing loans to SUBMITTED stage`);
    
    // Add additional stage-related columns
    await client.query(`
      ALTER TABLE loans 
      ADD COLUMN IF NOT EXISTS app_score DECIMAL(5,2),
      ADD COLUMN IF NOT EXISTS credit_score INTEGER,
      ADD COLUMN IF NOT EXISTS tags TEXT[],
      ADD COLUMN IF NOT EXISTS rejection_remarks TEXT,
      ADD COLUMN IF NOT EXISTS approval_remarks TEXT,
      ADD COLUMN IF NOT EXISTS roi DECIMAL(5,2),
      ADD COLUMN IF NOT EXISTS loan_account_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS rc_type VARCHAR(20),
      ADD COLUMN IF NOT EXISTS rc_collected_by VARCHAR(20),
      ADD COLUMN IF NOT EXISTS rto_agent_name_rc VARCHAR(255),
      ADD COLUMN IF NOT EXISTS rto_agent_mobile VARCHAR(20),
      ADD COLUMN IF NOT EXISTS banker_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS banker_mobile VARCHAR(20),
      ADD COLUMN IF NOT EXISTS cancellation_remarks TEXT
    `);
    console.log('✅ Added additional stage-related columns');
    
    // Create loan application stage history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS loan_application_stage_history (
        id SERIAL PRIMARY KEY,
        loan_id INT NOT NULL,
        from_stage VARCHAR(50),
        to_stage VARCHAR(50) NOT NULL,
        changed_by INT NOT NULL,
        remarks TEXT,
        stage_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created loan application stage history table');
    
    // Create indexes for history table
    await client.query(`CREATE INDEX IF NOT EXISTS idx_loan_stage_history_loan_id ON loan_application_stage_history(loan_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_loan_stage_history_created_at ON loan_application_stage_history(created_at)`);
    console.log('✅ Created history table indexes');
    
    console.log('🎉 Loan application stage migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migration
runLoanApplicationStageMigration()
  .then(() => {
    console.log('Migration finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
  });