-- Add bouncing fields to loans table
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS bouncing_3_months INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bouncing_6_months INTEGER DEFAULT 0;

-- Add comments for clarity
COMMENT ON COLUMN loans.bouncing_3_months IS 'Number of bouncing transactions in last 3 months';
COMMENT ON COLUMN loans.bouncing_6_months IS 'Number of bouncing transactions in last 6 months';
