-- Add refer_code column to users table
ALTER TABLE users ADD COLUMN refer_code VARCHAR(20) UNIQUE;

-- Generate refer codes for existing team leaders, branch managers, and DSAs
UPDATE users 
SET refer_code = CONCAT(
  CASE 
    WHEN role = 'team_leader' THEN 'TL'
    WHEN role = 'branch_manager' THEN 'BM'
    WHEN role = 'dsa' THEN 'DSA'
  END,
  LPAD(id::text, 4, '0')
)
WHERE role IN ('team_leader', 'branch_manager', 'dsa') AND refer_code IS NULL;

-- Show updated users
SELECT id, full_name, role, refer_code FROM users WHERE role IN ('team_leader', 'branch_manager', 'dsa') ORDER BY role, id;