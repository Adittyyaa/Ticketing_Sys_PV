-- ============================================
-- CREATE FIRST ADMIN ACCOUNT
-- ============================================
-- This script helps you create your first admin account
-- Run this AFTER creating the auth user in Supabase Dashboard

-- Step 1: Go to Supabase Dashboard → Authentication → Users
-- Step 2: Click "Add User" → "Create new user"
-- Step 3: Fill in email, password, and check "Auto Confirm User"
-- Step 4: Copy the user's UUID from the users table
-- Step 5: Replace 'YOUR-USER-UUID-HERE' below with the actual UUID
-- Step 6: Run this script in SQL Editor

-- ============================================
-- INSERT ADMIN USER PROFILE
-- ============================================
INSERT INTO public.tbl_users (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
)
VALUES (
  'beaca2ea-fea4-42b8-9b6d-8dcbee818a46',  -- Replace with actual UUID from auth.users
  'admin@pvadvisory.com', -- Replace with your admin email
  'System Administrator', -- Replace with admin's name
  'admin',                -- This makes them an admin
  NOW(),
  NOW()
)
ON CONFLICT (id) 
DO UPDATE SET
  role = 'admin',
  updated_at = NOW();

-- ============================================
-- VERIFY ADMIN WAS CREATED
-- ============================================
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM public.tbl_users
WHERE role = 'admin'
ORDER BY created_at DESC;

-- ============================================
-- EXPECTED OUTPUT
-- ============================================
-- You should see your admin user with:
-- - id: The UUID you entered
-- - email: Your admin email
-- - full_name: Admin name
-- - role: 'admin'
-- - created_at: Current timestamp

-- ============================================
-- NEXT STEPS
-- ============================================
-- 1. Go to /auth/login/admin
-- 2. Login with your admin credentials
-- 3. You should be redirected to /admin (admin dashboard)
-- 4. Click "Manage Admins" to create additional admins
-- ============================================

-- ============================================
-- ALTERNATIVE: PROMOTE EXISTING USER TO ADMIN
-- ============================================
-- If you already have a user account and want to make it an admin:

-- UPDATE public.tbl_users
-- SET role = 'admin', updated_at = NOW()
-- WHERE email = 'your-existing-email@example.com';

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- Check if user exists in auth.users:
-- SELECT id, email, created_at FROM auth.users WHERE email = 'admin@pvadvisory.com';

-- Check if user exists in tbl_users:
-- SELECT * FROM public.tbl_users WHERE email = 'admin@pvadvisory.com';

-- List all current admins:
-- SELECT email, full_name, created_at FROM public.tbl_users WHERE role = 'admin';

-- Count users by role:
-- SELECT role, COUNT(*) as count FROM public.tbl_users GROUP BY role;
