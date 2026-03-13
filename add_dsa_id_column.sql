-- Add dsa_id column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS dsa_id INT;

-- Add foreign key constraint if it doesn't exist
ALTER TABLE users ADD CONSTRAINT fk_users_dsa_id 
FOREIGN KEY (dsa_id) REFERENCES users(id) ON DELETE SET NULL;
