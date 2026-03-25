-- Add application stage columns to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS application_stage VARCHAR(20) DEFAULT 'SUBMITTED',
ADD COLUMN IF NOT EXISTS stage_data JSONB,
ADD COLUMN IF NOT EXISTS stage_history JSONB[];

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_leads_application_stage ON leads(application_stage);

-- Update existing leads to have SUBMITTED stage
UPDATE leads 
SET application_stage = 'SUBMITTED' 
WHERE application_stage IS NULL;

-- Create a function to automatically cancel APPROVED leads after 30 days
CREATE OR REPLACE FUNCTION auto_cancel_expired_approvals()
RETURNS void AS $$
BEGIN
    UPDATE leads 
    SET application_stage = 'CANCELLED',
        stage_data = jsonb_build_object(
            'stage', 'CANCELLED',
            'updatedAt', NOW(),
            'updatedBy', 'System',
            'cancelledData', jsonb_build_object(
                'remarks', 'Auto-cancelled: Not disbursed within 30 days of approval',
                'cancelledDate', NOW()
            )
        ),
        stage_history = COALESCE(stage_history, '[]'::jsonb[]) || 
                       ARRAY[jsonb_build_object(
                           'stage', 'CANCELLED',
                           'updatedAt', NOW(),
                           'updatedBy', 'System',
                           'cancelledData', jsonb_build_object(
                               'remarks', 'Auto-cancelled: Not disbursed within 30 days of approval',
                               'cancelledDate', NOW()
                           )
                       )]
    WHERE application_stage = 'APPROVED' 
    AND stage_data->>'approvedData'->>'approvedDate' IS NOT NULL
    AND (stage_data->>'approvedData'->>'approvedDate')::timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run the auto-cancellation function daily
-- Note: This requires pg_cron extension or external scheduler
-- SELECT cron.schedule('auto-cancel-approvals', '0 0 * * *', 'SELECT auto_cancel_expired_approvals();');

COMMIT;