-- Add application stage fields to loans table
ALTER TABLE loans ADD COLUMN IF NOT EXISTS application_stage VARCHAR(50) DEFAULT 'submitted';
ALTER TABLE loans ADD COLUMN IF NOT EXISTS app_score DECIMAL(5,2);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS credit_score INT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE loans ADD COLUMN IF NOT EXISTS rejection_remarks TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS approval_remarks TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS roi DECIMAL(5,2);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS loan_account_number VARCHAR(100);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS rc_type VARCHAR(20);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS rc_collected_by VARCHAR(20);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS rto_agent_name_rc VARCHAR(255);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS rto_agent_mobile VARCHAR(20);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS banker_name VARCHAR(255);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS banker_mobile VARCHAR(20);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS cancellation_remarks TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS stage_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for application_stage
CREATE INDEX IF NOT EXISTS idx_loans_application_stage ON loans(application_stage);

-- Create application stage history table
CREATE TABLE IF NOT EXISTS application_stage_history (
  id SERIAL PRIMARY KEY,
  loan_id INT NOT NULL,
  from_stage VARCHAR(50),
  to_stage VARCHAR(50) NOT NULL,
  changed_by INT NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_stage_history_loan ON application_stage_history(loan_id);
