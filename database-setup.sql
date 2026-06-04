-- ============================================
-- TICKETING SYSTEM - DATABASE SETUP
-- Run this in Supabase SQL Editor after creating your project
-- ============================================

-- ============================================
-- STEP 1: Clean slate - disable RLS and drop all policies
-- ============================================
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attachments DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all users table policies
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.users';
    END LOOP;
    
    -- Drop all tickets table policies
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tickets' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.tickets';
    END LOOP;
END $$;

-- ============================================
-- STEP 2: Create helper function to get user role
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- STEP 3: Enable RLS on all tables
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attachments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Create USERS table policies
-- ============================================

-- Allow users to SELECT their own record
CREATE POLICY "users_select_own"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- Allow users to INSERT their own record (for new signups)
CREATE POLICY "users_insert_own"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to UPDATE their own record
CREATE POLICY "users_update_own"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- STEP 5: Create TICKETS table policies
-- ============================================

-- All authenticated users can view all tickets
CREATE POLICY "tickets_select_all_authenticated"
ON public.tickets FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can create tickets
CREATE POLICY "tickets_insert_own"
ON public.tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own tickets, admins can update any
CREATE POLICY "tickets_update_own_or_admin"
ON public.tickets FOR UPDATE
USING (auth.uid() = user_id OR public.get_user_role() = 'admin')
WITH CHECK (auth.uid() = user_id OR public.get_user_role() = 'admin');

-- Users can delete their own tickets, admins can delete any
CREATE POLICY "tickets_delete_own_or_admin"
ON public.tickets FOR DELETE
USING (auth.uid() = user_id OR public.get_user_role() = 'admin');

-- ============================================
-- STEP 6: Add name and email fields to comments (if not exists)
-- ============================================
ALTER TABLE IF EXISTS public.comments 
ADD COLUMN IF NOT EXISTS commenter_name VARCHAR(255);

ALTER TABLE IF EXISTS public.comments 
ADD COLUMN IF NOT EXISTS commenter_email VARCHAR(255);

-- ============================================
-- STEP 7: Create Storage bucket for attachments (run in Storage section)
-- ============================================
-- Go to Storage in Supabase Dashboard and create a bucket named: ticket-attachments
-- Set it to: Public = false

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Setup complete! Check policies below:' as status;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
