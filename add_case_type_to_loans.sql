-- Add case_type column to loans table

-- Add case_type column to loans table
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS case_type VARCHAR(50);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'loans' 
AND column_name = 'case_type';

-- Show sample of loans table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'loans' 
ORDER BY ordinal_position;