-- Add customer_id field to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS customer_id VARCHAR(50);

-- Add missing fields that frontend expects
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'new';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_date DATE;