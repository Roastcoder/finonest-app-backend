-- Add loan_id column to documents table for direct loan document linking
ALTER TABLE documents ADD COLUMN IF NOT EXISTS loan_id INT REFERENCES loans(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_documents_loan_id ON documents(loan_id);
