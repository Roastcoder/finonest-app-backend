-- Replace village and tehsil with landmark columns in loans table

-- Add landmark columns
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS current_landmark VARCHAR(255),
ADD COLUMN IF NOT EXISTS permanent_landmark VARCHAR(255);

-- Drop village and tehsil columns (optional - comment out if you want to keep old data)
-- ALTER TABLE loans 
-- DROP COLUMN IF EXISTS current_village,
-- DROP COLUMN IF EXISTS current_tehsil,
-- DROP COLUMN IF EXISTS permanent_village,
-- DROP COLUMN IF EXISTS permanent_tehsil;

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'loans' 
AND column_name IN ('current_landmark', 'permanent_landmark')
ORDER BY column_name;
