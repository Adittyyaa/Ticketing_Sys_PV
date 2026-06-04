-- ============================================
-- MIGRATION: Rename tables to use tbl_ prefix
-- WARNING: This will rename your existing tables!
-- Run this in Supabase SQL Editor ONLY if you want to rename existing tables
-- ============================================

-- Step 1: Disable RLS on all tables
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attachments DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies (they reference old table names)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop users table policies
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.users CASCADE';
    END LOOP;
    
    -- Drop tickets table policies
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tickets' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.tickets CASCADE';
    END LOOP;
    
    -- Drop comments table policies
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'comments' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.comments CASCADE';
    END LOOP;
    
    -- Drop attachments table policies
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'attachments' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.attachments CASCADE';
    END LOOP;
END $$;

-- Step 3: Rename tables
ALTER TABLE IF EXISTS public.users RENAME TO tbl_users;
ALTER TABLE IF EXISTS public.tickets RENAME TO tbl_tickets;
ALTER TABLE IF EXISTS public.comments RENAME TO tbl_comments;
ALTER TABLE IF EXISTS public.attachments RENAME TO tbl_attachments;

-- Step 4: Update foreign key constraint names (optional but cleaner)
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Rename constraints for tbl_tickets
    FOR constraint_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'tbl_tickets' 
        AND constraint_type = 'FOREIGN KEY'
    LOOP
        EXECUTE 'ALTER TABLE tbl_tickets RENAME CONSTRAINT ' || 
                quote_ident(constraint_record.constraint_name) || 
                ' TO tbl_' || constraint_record.constraint_name;
    END LOOP;
    
    -- Rename constraints for tbl_comments
    FOR constraint_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'tbl_comments' 
        AND constraint_type = 'FOREIGN KEY'
    LOOP
        EXECUTE 'ALTER TABLE tbl_comments RENAME CONSTRAINT ' || 
                quote_ident(constraint_record.constraint_name) || 
                ' TO tbl_' || constraint_record.constraint_name;
    END LOOP;
    
    -- Rename constraints for tbl_attachments
    FOR constraint_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'tbl_attachments' 
        AND constraint_type = 'FOREIGN KEY'
    LOOP
        EXECUTE 'ALTER TABLE tbl_attachments RENAME CONSTRAINT ' || 
                quote_ident(constraint_record.constraint_name) || 
                ' TO tbl_' || constraint_record.constraint_name;
    END LOOP;
END $$;

-- Step 5: Create helper function with new table name
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.tbl_users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 6: Enable RLS on renamed tables
ALTER TABLE public.tbl_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_attachments ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for tbl_users
CREATE POLICY "tbl_users_select_own"
ON public.tbl_users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "tbl_users_insert_own"
ON public.tbl_users FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "tbl_users_update_own"
ON public.tbl_users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Step 8: Create RLS policies for tbl_tickets
CREATE POLICY "tbl_tickets_select_all_authenticated"
ON public.tbl_tickets FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "tbl_tickets_insert_own"
ON public.tbl_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tbl_tickets_update_own_or_admin"
ON public.tbl_tickets FOR UPDATE
USING (auth.uid() = user_id OR public.get_user_role() = 'admin')
WITH CHECK (auth.uid() = user_id OR public.get_user_role() = 'admin');

CREATE POLICY "tbl_tickets_delete_own_or_admin"
ON public.tbl_tickets FOR DELETE
USING (auth.uid() = user_id OR public.get_user_role() = 'admin');

-- Step 9: Create RLS policies for tbl_comments
CREATE POLICY "tbl_comments_select_authenticated"
ON public.tbl_comments FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "tbl_comments_insert_authenticated"
ON public.tbl_comments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "tbl_comments_delete_own_or_admin"
ON public.tbl_comments FOR DELETE
USING (auth.uid() = user_id OR public.get_user_role() = 'admin');

-- Step 10: Create RLS policies for tbl_attachments
CREATE POLICY "tbl_attachments_select_authenticated"
ON public.tbl_attachments FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "tbl_attachments_insert_own"
ON public.tbl_attachments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tbl_attachments_delete_own_or_admin"
ON public.tbl_attachments FOR DELETE
USING (auth.uid() = user_id OR public.get_user_role() = 'admin');

-- Verification
SELECT 'Migration complete! Tables renamed:' as status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'tbl_%';

SELECT 'RLS Policies created:' as status;
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename LIKE 'tbl_%';
