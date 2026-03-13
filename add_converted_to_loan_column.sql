-- Add converted_to_loan column to leads table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'converted_to_loan'
    ) THEN
        ALTER TABLE leads ADD COLUMN converted_to_loan BOOLEAN DEFAULT false;
        RAISE NOTICE 'Column converted_to_loan added to leads table';
    ELSE
        RAISE NOTICE 'Column converted_to_loan already exists in leads table';
    END IF;
END $$;

-- Add loan_created_at column to leads table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'loan_created_at'
    ) THEN
        ALTER TABLE leads ADD COLUMN loan_created_at TIMESTAMP;
        RAISE NOTICE 'Column loan_created_at added to leads table';
    ELSE
        RAISE NOTICE 'Column loan_created_at already exists in leads table';
    END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_converted_to_loan ON leads(converted_to_loan);
