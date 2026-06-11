-- ============================================
-- TICKETING SYSTEM - DATABASE SETUP
-- Run this in Supabase SQL Editor after creating your project
-- ============================================

-- ============================================
-- STEP 1: Clean slate - disable RLS and drop all policies
-- ============================================
ALTER TABLE IF EXISTS public.tbl_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tbl_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tbl_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tbl_attachments DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all tbl_users table policies
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tbl_users' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.tbl_users';
    END LOOP;
    
    -- Drop all tbl_tickets table policies
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tbl_tickets' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.tbl_tickets';
    END LOOP;
END $$;

-- ============================================
-- STEP 2: Create helper function to get user role
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.tbl_users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- STEP 3: Enable RLS on all tables
-- ============================================
ALTER TABLE public.tbl_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tbl_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tbl_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Create tbl_users table policies
-- ============================================

-- Allow users to SELECT their own record
CREATE POLICY "tbl_users_select_own"
ON public.tbl_users FOR SELECT
USING (auth.uid() = id);

-- Allow users to INSERT their own record (for new signups)
CREATE POLICY "tbl_users_insert_own"
ON public.tbl_users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to UPDATE their own record
CREATE POLICY "tbl_users_update_own"
ON public.tbl_users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- STEP 5: Create tbl_tickets table policies
-- ============================================

-- All authenticated users can view all tickets
CREATE POLICY "tbl_tickets_select_all_authenticated"
ON public.tbl_tickets FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can create tickets
CREATE POLICY "tbl_tickets_insert_own"
ON public.tbl_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own tickets, admins can update any
CREATE POLICY "tbl_tickets_update_own_or_admin"
ON public.tbl_tickets FOR UPDATE
USING (auth.uid() = user_id OR public.get_user_role() = 'admin')
WITH CHECK (auth.uid() = user_id OR public.get_user_role() = 'admin');

-- Users can delete their own tickets, admins can delete any
CREATE POLICY "tbl_tickets_delete_own_or_admin"
ON public.tbl_tickets FOR DELETE
USING (auth.uid() = user_id OR public.get_user_role() = 'admin');

-- ============================================
-- STEP 7: Create Analytics View
-- ============================================
CREATE OR REPLACE VIEW public.tbl_ticket_analytics AS
SELECT
    COUNT(*) as total_tickets,
    COUNT(*) FILTER (WHERE status = 'UNTOUCHED') as untouched_count,
    COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
    COUNT(*) FILTER (WHERE status = 'OPENED') as opened_count,
    COUNT(*) FILTER (WHERE status = 'SOLVED') as solved_count,
    COUNT(*) FILTER (WHERE priority = 'LOW') as low_priority,
    COUNT(*) FILTER (WHERE priority = 'MEDIUM') as medium_priority,
    COUNT(*) FILTER (WHERE priority = 'HIGH') as high_priority,
    COUNT(*) FILTER (WHERE priority = 'URGENT') as urgent_priority,
    COUNT(DISTINCT user_id) as unique_users,
    COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) FILTER (WHERE status = 'SOLVED'), 0)::numeric(10,2) as avg_resolution_hours
FROM public.tbl_tickets;

-- Grant access to authenticated users
GRANT SELECT ON public.tbl_ticket_analytics TO authenticated;

-- ============================================
-- STEP 8: Add name and email fields to tbl_comments (if not exists)
-- ============================================
ALTER TABLE IF EXISTS public.tbl_comments 
ADD COLUMN IF NOT EXISTS commenter_name VARCHAR(255);

ALTER TABLE IF EXISTS public.tbl_comments 
ADD COLUMN IF NOT EXISTS commenter_email VARCHAR(255);

-- ============================================
-- STEP 9: Create Storage bucket for attachments (run in Storage section)
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
