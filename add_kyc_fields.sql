-- Add PAN and Aadhaar fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS pan_number VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(12);
ALTER TABLE users ADD COLUMN IF NOT EXISTS pan_data JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_data JSONB;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_pan_number ON users(pan_number);
CREATE INDEX IF NOT EXISTS idx_users_aadhaar_number ON users(aadhaar_number);