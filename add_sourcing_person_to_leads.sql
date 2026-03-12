-- Add sourcing_person_name column to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS sourcing_person_name VARCHAR(255);

-- Verify column added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name = 'sourcing_person_name';
