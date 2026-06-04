-- ============================================
-- ACCOUNT DETAILS MIGRATION
-- Adds fields to support user profile editing
-- ============================================

-- Add new columns to tbl_users if they don't exist
ALTER TABLE public.tbl_users
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS job_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS company VARCHAR(255),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);

-- Add comment to clarify joining_date is created_at
COMMENT ON COLUMN public.tbl_users.created_at IS 'User joining date - automatically set on user creation';

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_tbl_users_email ON public.tbl_users(email);

-- Verify the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tbl_users' 
ORDER BY ordinal_position;
