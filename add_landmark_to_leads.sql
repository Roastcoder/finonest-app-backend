-- Add landmark column to leads table

-- Add current_landmark column to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS current_landmark VARCHAR(255);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name = 'current_landmark';

-- Show sample of leads table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
ORDER BY ordinal_position;