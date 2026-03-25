-- Comprehensive database migration to fix all issues
-- Run this script to ensure all required tables and columns exist

-- Add missing columns to leads table
DO $$ 
BEGIN
    -- Add customer_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'customer_id') THEN
        ALTER TABLE leads ADD COLUMN customer_id VARCHAR(50);
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'status') THEN
        ALTER TABLE leads ADD COLUMN status VARCHAR(50) DEFAULT 'new';
    END IF;
    
    -- Add source column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'source') THEN
        ALTER TABLE leads ADD COLUMN source VARCHAR(255);
    END IF;
    
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'notes') THEN
        ALTER TABLE leads ADD COLUMN notes TEXT;
    END IF;
    
    -- Add follow_up_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'follow_up_date') THEN
        ALTER TABLE leads ADD COLUMN follow_up_date DATE;
    END IF;
END $$;

-- Add missing columns to loans table
DO $$ 
BEGIN
    -- Add all missing loan columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'customer_id') THEN
        ALTER TABLE loans ADD COLUMN customer_id VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'applicant_name') THEN
        ALTER TABLE loans ADD COLUMN applicant_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'mobile') THEN
        ALTER TABLE loans ADD COLUMN mobile VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'co_applicant_name') THEN
        ALTER TABLE loans ADD COLUMN co_applicant_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'co_applicant_mobile') THEN
        ALTER TABLE loans ADD COLUMN co_applicant_mobile VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'guarantor_name') THEN
        ALTER TABLE loans ADD COLUMN guarantor_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'guarantor_mobile') THEN
        ALTER TABLE loans ADD COLUMN guarantor_mobile VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'current_address') THEN
        ALTER TABLE loans ADD COLUMN current_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'current_village') THEN
        ALTER TABLE loans ADD COLUMN current_village VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'current_tehsil') THEN
        ALTER TABLE loans ADD COLUMN current_tehsil VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'current_district') THEN
        ALTER TABLE loans ADD COLUMN current_district VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'current_state') THEN
        ALTER TABLE loans ADD COLUMN current_state VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'current_pincode') THEN
        ALTER TABLE loans ADD COLUMN current_pincode VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'permanent_address') THEN
        ALTER TABLE loans ADD COLUMN permanent_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'permanent_village') THEN
        ALTER TABLE loans ADD COLUMN permanent_village VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'permanent_tehsil') THEN
        ALTER TABLE loans ADD COLUMN permanent_tehsil VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'permanent_district') THEN
        ALTER TABLE loans ADD COLUMN permanent_district VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'permanent_state') THEN
        ALTER TABLE loans ADD COLUMN permanent_state VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'permanent_pincode') THEN
        ALTER TABLE loans ADD COLUMN permanent_pincode VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'our_branch') THEN
        ALTER TABLE loans ADD COLUMN our_branch VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'income_source') THEN
        ALTER TABLE loans ADD COLUMN income_source VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'monthly_income') THEN
        ALTER TABLE loans ADD COLUMN monthly_income DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'selected_financier') THEN
        ALTER TABLE loans ADD COLUMN selected_financier VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'financier_location') THEN
        ALTER TABLE loans ADD COLUMN financier_location VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'ltv') THEN
        ALTER TABLE loans ADD COLUMN ltv DECIMAL(5,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'loan_type_vehicle') THEN
        ALTER TABLE loans ADD COLUMN loan_type_vehicle VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'vehicle_number') THEN
        ALTER TABLE loans ADD COLUMN vehicle_number VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'maker_name') THEN
        ALTER TABLE loans ADD COLUMN maker_name VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'model_variant_name') THEN
        ALTER TABLE loans ADD COLUMN model_variant_name VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'mfg_year') THEN
        ALTER TABLE loans ADD COLUMN mfg_year VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'vertical') THEN
        ALTER TABLE loans ADD COLUMN vertical VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'scheme') THEN
        ALTER TABLE loans ADD COLUMN scheme VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'emi_amount') THEN
        ALTER TABLE loans ADD COLUMN emi_amount DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'total_emi') THEN
        ALTER TABLE loans ADD COLUMN total_emi INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'total_interest') THEN
        ALTER TABLE loans ADD COLUMN total_interest DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'irr') THEN
        ALTER TABLE loans ADD COLUMN irr DECIMAL(5,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'emi_start_date') THEN
        ALTER TABLE loans ADD COLUMN emi_start_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'emi_end_date') THEN
        ALTER TABLE loans ADD COLUMN emi_end_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'processing_fee') THEN
        ALTER TABLE loans ADD COLUMN processing_fee DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'emi') THEN
        ALTER TABLE loans ADD COLUMN emi DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'assigned_bank_id') THEN
        ALTER TABLE loans ADD COLUMN assigned_bank_id INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'assigned_broker_id') THEN
        ALTER TABLE loans ADD COLUMN assigned_broker_id INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'financier_name') THEN
        ALTER TABLE loans ADD COLUMN financier_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'sanction_amount') THEN
        ALTER TABLE loans ADD COLUMN sanction_amount DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'sanction_date') THEN
        ALTER TABLE loans ADD COLUMN sanction_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'insurance_company_name') THEN
        ALTER TABLE loans ADD COLUMN insurance_company_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'premium_amount') THEN
        ALTER TABLE loans ADD COLUMN premium_amount DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'insurance_date') THEN
        ALTER TABLE loans ADD COLUMN insurance_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'insurance_policy_number') THEN
        ALTER TABLE loans ADD COLUMN insurance_policy_number VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'total_deduction') THEN
        ALTER TABLE loans ADD COLUMN total_deduction DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'net_disbursement_amount') THEN
        ALTER TABLE loans ADD COLUMN net_disbursement_amount DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'payment_received_date') THEN
        ALTER TABLE loans ADD COLUMN payment_received_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'rc_owner_name') THEN
        ALTER TABLE loans ADD COLUMN rc_owner_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'rto_agent_name') THEN
        ALTER TABLE loans ADD COLUMN rto_agent_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'agent_mobile_no') THEN
        ALTER TABLE loans ADD COLUMN agent_mobile_no VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'login_date') THEN
        ALTER TABLE loans ADD COLUMN login_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'approval_date') THEN
        ALTER TABLE loans ADD COLUMN approval_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'sourcing_person_name') THEN
        ALTER TABLE loans ADD COLUMN sourcing_person_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'remark') THEN
        ALTER TABLE loans ADD COLUMN remark TEXT;
    END IF;
END $$;

-- Add missing columns to users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'status') THEN
        ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    -- Add foreign key for assigned_bank_id in loans table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_loans_assigned_bank' 
        AND table_name = 'loans'
    ) THEN
        ALTER TABLE loans ADD CONSTRAINT fk_loans_assigned_bank 
        FOREIGN KEY (assigned_bank_id) REFERENCES banks(id) ON DELETE SET NULL;
    END IF;
    
    -- Add foreign key for assigned_broker_id in loans table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_loans_assigned_broker' 
        AND table_name = 'loans'
    ) THEN
        ALTER TABLE loans ADD CONSTRAINT fk_loans_assigned_broker 
        FOREIGN KEY (assigned_broker_id) REFERENCES brokers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Update existing records to populate new columns
UPDATE loans SET 
  applicant_name = COALESCE(applicant_name, customer_name),
  mobile = COALESCE(mobile, phone),
  assigned_bank_id = COALESCE(assigned_bank_id, bank_id),
  assigned_broker_id = COALESCE(assigned_broker_id, broker_id),
  irr = COALESCE(irr, interest_rate)
WHERE applicant_name IS NULL OR mobile IS NULL OR assigned_bank_id IS NULL;

-- Insert default system configurations if they don't exist
INSERT INTO system_config (config_key, config_value, config_type, description) 
SELECT * FROM (VALUES
  ('company_name', 'Finonest', 'general', 'Company name'),
  ('timezone', 'Asia/Kolkata', 'general', 'System timezone'),
  ('currency', 'INR', 'general', 'System currency'),
  ('session_timeout', '30', 'general', 'Session timeout in minutes'),
  ('max_file_size', '10485760', 'document', 'Max file upload size in bytes (10MB)'),
  ('allowed_file_types', 'jpg,jpeg,png,pdf', 'document', 'Allowed file extensions')
) AS v(config_key, config_value, config_type, description)
WHERE NOT EXISTS (
  SELECT 1 FROM system_config WHERE system_config.config_key = v.config_key
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON leads(customer_id);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by);

CREATE INDEX IF NOT EXISTS idx_loans_customer_id ON loans(customer_id);
CREATE INDEX IF NOT EXISTS idx_loans_mobile ON loans(mobile);
CREATE INDEX IF NOT EXISTS idx_loans_phone ON loans(phone);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_assigned_to ON loans(assigned_to);
CREATE INDEX IF NOT EXISTS idx_loans_created_by ON loans(created_by);
CREATE INDEX IF NOT EXISTS idx_loans_assigned_bank_id ON loans(assigned_bank_id);
CREATE INDEX IF NOT EXISTS idx_loans_assigned_broker_id ON loans(assigned_broker_id);

CREATE INDEX IF NOT EXISTS idx_documents_lead_id ON documents(lead_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

COMMIT;