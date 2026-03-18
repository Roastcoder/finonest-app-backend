-- Add existing loan and EMI details columns to loans table
ALTER TABLE loans
ADD COLUMN IF NOT EXISTS existing_loan_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS existing_loan_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS existing_tenure INTEGER,
ADD COLUMN IF NOT EXISTS existing_emi DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS no_of_emi_paid INTEGER,
ADD COLUMN IF NOT EXISTS bouncing_3_months INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bouncing_6_months INTEGER DEFAULT 0;

COMMENT ON COLUMN loans.existing_loan_status IS 'Status of existing loan (Active, Closed, Default)';
COMMENT ON COLUMN loans.existing_loan_amount IS 'Amount of existing loan';
COMMENT ON COLUMN loans.existing_tenure IS 'Tenure of existing loan in months';
COMMENT ON COLUMN loans.existing_emi IS 'EMI amount of existing loan';
COMMENT ON COLUMN loans.no_of_emi_paid IS 'Number of EMI payments made';
COMMENT ON COLUMN loans.bouncing_3_months IS 'Number of bouncing transactions in last 3 months';
COMMENT ON COLUMN loans.bouncing_6_months IS 'Number of bouncing transactions in last 6 months';
