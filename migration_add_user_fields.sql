-- Add new columns to users table if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Update existing users with user_id if null
DO $$
DECLARE
    user_record RECORD;
    seq_num INT := 1;
    initials VARCHAR(2);
    new_user_id VARCHAR(50);
BEGIN
    FOR user_record IN SELECT id, name, full_name FROM users WHERE user_id IS NULL ORDER BY id
    LOOP
        -- Get initials from name or full_name
        initials := UPPER(SUBSTRING(COALESCE(user_record.full_name, user_record.name, 'XX'), 1, 2));
        new_user_id := initials || '-' || LPAD(seq_num::TEXT, 4, '0');
        
        UPDATE users SET user_id = new_user_id WHERE id = user_record.id;
        seq_num := seq_num + 1;
    END LOOP;
END $$;

-- Copy name to full_name if full_name is null
UPDATE users SET full_name = name WHERE full_name IS NULL;

-- Make user_id NOT NULL after populating
ALTER TABLE users ALTER COLUMN user_id SET NOT NULL;
