-- Update all existing users to active status
UPDATE users SET status = 'active' WHERE status IS NULL OR status = '';

-- Show updated users
SELECT id, full_name, email, role, status FROM users ORDER BY id;