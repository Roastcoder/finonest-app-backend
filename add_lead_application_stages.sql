-- Add application stage columns to leads table if they don't exist
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS application_stage VARCHAR(20) DEFAULT 'SUBMITTED',
ADD COLUMN IF NOT EXISTS stage_data JSONB,
ADD COLUMN IF NOT EXISTS stage_history JSONB[],
ADD COLUMN IF NOT EXISTS stage_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS converted_to_loan BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS loan_created_at TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_application_stage ON leads(application_stage);
CREATE INDEX IF NOT EXISTS idx_leads_stage_changed_at ON leads(stage_changed_at);

-- Update existing leads to have SUBMITTED stage if null
UPDATE leads 
SET application_stage = 'SUBMITTED',
    stage_data = ('{"stage": "SUBMITTED", "submittedAt": "' || created_at::text || '", "action": "Lead created"}')::jsonb,
    stage_history = ARRAY[('{"stage": "SUBMITTED", "submittedAt": "' || created_at::text || '", "action": "Lead created"}')::jsonb]
WHERE application_stage IS NULL OR application_stage = '';

-- Create lead application stage history table for tracking
CREATE TABLE IF NOT EXISTS lead_application_stage_history (
  id SERIAL PRIMARY KEY,
  lead_id INT NOT NULL,
  from_stage VARCHAR(50),
  to_stage VARCHAR(50) NOT NULL,
  changed_by INT NOT NULL,
  remarks TEXT,
  stage_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lead_stage_history_lead_id ON lead_application_stage_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_stage_history_created_at ON lead_application_stage_history(created_at);

COMMIT;