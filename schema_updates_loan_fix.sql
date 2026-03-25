-- Add missing columns to loans table to match frontend requirements
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS customer_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS applicant_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS mobile VARCHAR(20),
ADD COLUMN IF NOT EXISTS co_applicant_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS co_applicant_mobile VARCHAR(20),
ADD COLUMN IF NOT EXISTS guarantor_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS guarantor_mobile VARCHAR(20),
ADD COLUMN IF NOT EXISTS current_address TEXT,
ADD COLUMN IF NOT EXISTS current_village VARCHAR(100),
ADD COLUMN IF NOT EXISTS current_tehsil VARCHAR(100),
ADD COLUMN IF NOT EXISTS current_district VARCHAR(100),
ADD COLUMN IF NOT EXISTS current_pincode VARCHAR(10),
ADD COLUMN IF NOT EXISTS permanent_address TEXT,
ADD COLUMN IF NOT EXISTS permanent_village VARCHAR(100),
ADD COLUMN IF NOT EXISTS permanent_tehsil VARCHAR(100),
ADD COLUMN IF NOT EXISTS permanent_district VARCHAR(100),
ADD COLUMN IF NOT EXISTS permanent_pincode VARCHAR(10),
ADD COLUMN IF NOT EXISTS our_branch VARCHAR(100),
ADD COLUMN IF NOT EXISTS income_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS ltv DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS loan_type_vehicle VARCHAR(100),
ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS maker_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS model_variant_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS mfg_year VARCHAR(10),
ADD COLUMN IF NOT EXISTS vertical VARCHAR(50),
ADD COLUMN IF NOT EXISTS scheme VARCHAR(100),
ADD COLUMN IF NOT EXISTS emi_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS total_emi INTEGER,
ADD COLUMN IF NOT EXISTS total_interest DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS irr DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS emi_start_date DATE,
ADD COLUMN IF NOT EXISTS emi_end_date DATE,
ADD COLUMN IF NOT EXISTS processing_fee DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS emi DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS assigned_bank_id INTEGER,
ADD COLUMN IF NOT EXISTS assigned_broker_id INTEGER,
ADD COLUMN IF NOT EXISTS sanction_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS sanction_date DATE,
ADD COLUMN IF NOT EXISTS insurance_company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS premium_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS insurance_date DATE,
ADD COLUMN IF NOT EXISTS insurance_policy_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS total_deduction DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS net_disbursement_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS payment_received_date DATE,
ADD COLUMN IF NOT EXISTS rc_owner_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS rto_agent_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS agent_mobile_no VARCHAR(20),
ADD COLUMN IF NOT EXISTS login_date DATE,
ADD COLUMN IF NOT EXISTS approval_date DATE,
ADD COLUMN IF NOT EXISTS sourcing_person_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS remark TEXT;

-- Add foreign key constraints for the new bank and broker columns
ALTER TABLE loans 
ADD CONSTRAINT fk_loans_assigned_bank 
FOREIGN KEY (assigned_bank_id) REFERENCES banks(id) ON DELETE SET NULL;

ALTER TABLE loans 
ADD CONSTRAINT fk_loans_assigned_broker 
FOREIGN KEY (assigned_broker_id) REFERENCES brokers(id) ON DELETE SET NULL;

-- Update existing records to use the new columns
UPDATE loans SET 
  applicant_name = customer_name,
  mobile = phone,
  assigned_bank_id = bank_id,
  assigned_broker_id = broker_id,
  irr = interest_rate
WHERE applicant_name IS NULL;
