-- Fix customer_name constraint issue in loans table
-- This script will make customer_name nullable and update existing NULL values

BEGIN;

-- First, let's see what we're dealing with
SELECT id, loan_number, customer_name, applicant_name 
FROM loans 
WHERE customer_name IS NULL 
LIMIT 5;

-- Update existing NULL customer_name values with a default value or from applicant_name
UPDATE loans 
SET customer_name = COALESCE(applicant_name, 'Unknown Customer')
WHERE customer_name IS NULL;

-- Now make the column nullable to prevent future issues
ALTER TABLE loans ALTER COLUMN customer_name DROP NOT NULL;

-- Verify the changes
SELECT id, loan_number, customer_name, applicant_name 
FROM loans 
WHERE customer_name = 'Unknown Customer' 
LIMIT 5;

COMMIT;