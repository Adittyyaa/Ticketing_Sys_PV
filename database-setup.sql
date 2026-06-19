-- ============================================
-- TICKETING SYSTEM - DATABASE SETUP
-- Run this in Supabase SQL Editor after creating your project
-- ============================================

-- ============================================
-- STEP 0: Create tables if not exists
-- ============================================

CREATE TABLE IF NOT EXISTS public.tbl_users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tbl_tickets (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
   number SERIAL UNIQUE,
   title VARCHAR(255) NOT NULL,
   description TEXT NOT NULL,
   category VARCHAR(255) NOT NULL,
   type VARCHAR(255),
   product VARCHAR(100),
   product_reference_number VARCHAR(255),
   priority VARCHAR(50) DEFAULT 'MEDIUM' NOT NULL,
   status VARCHAR(50) DEFAULT 'UNTOUCHED' NOT NULL,
   tags TEXT[] DEFAULT '{}',
   assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
   comment_count INTEGER DEFAULT 0 NOT NULL
 );

CREATE TABLE IF NOT EXISTS public.tbl_comments (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   ticket_id UUID NOT NULL REFERENCES public.tbl_tickets(id) ON DELETE CASCADE,
   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
   content TEXT NOT NULL,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
   commenter_name VARCHAR(255)
 );

CREATE TABLE IF NOT EXISTS public.tbl_attachments (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   ticket_id UUID NOT NULL REFERENCES public.tbl_tickets(id) ON DELETE CASCADE,
   file_name VARCHAR(255) NOT NULL,
   file_path VARCHAR(500) NOT NULL,
   file_size INTEGER,
   file_type VARCHAR(100),
   uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
 );

CREATE TABLE IF NOT EXISTS public.tbl_feedback (
   id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
   category TEXT NOT NULL,
   rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
   message TEXT NOT NULL,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
 );

CREATE TABLE IF NOT EXISTS public.tbl_contacts (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   name VARCHAR(255) NOT NULL,
   email VARCHAR(255) NOT NULL,
   phone VARCHAR(50),
   position VARCHAR(255),
   department VARCHAR(255),
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
 );

-- Categories, Tags, and Ticket Types
CREATE TABLE IF NOT EXISTS public.tbl_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tbl_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tbl_ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add unique constraints (safe to skip if exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tbl_categories_name_key'
  ) THEN
    ALTER TABLE public.tbl_categories ADD CONSTRAINT tbl_categories_name_key UNIQUE (name);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tbl_tags_name_key'
  ) THEN
    ALTER TABLE public.tbl_tags ADD CONSTRAINT tbl_tags_name_key UNIQUE (name);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tbl_ticket_types_name_key'
  ) THEN
    ALTER TABLE public.tbl_ticket_types ADD CONSTRAINT tbl_ticket_types_name_key UNIQUE (name);
  END IF;
END $$;

ALTER TABLE IF EXISTS public.tbl_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tbl_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tbl_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tbl_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tbl_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tbl_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tbl_ticket_types ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 1: Clean slate - disable RLS and drop all policies
-- ============================================
ALTER TABLE IF EXISTS public.tbl_users DISABLE ROW LEVEL SECURITY;
 ALTER TABLE IF EXISTS public.tbl_tickets DISABLE ROW LEVEL SECURITY;
 ALTER TABLE IF EXISTS public.tbl_comments DISABLE ROW LEVEL SECURITY;
 ALTER TABLE IF EXISTS public.tbl_attachments DISABLE ROW LEVEL SECURITY;
 ALTER TABLE IF EXISTS public.tbl_feedback DISABLE ROW LEVEL SECURITY;
 ALTER TABLE IF EXISTS public.tbl_contacts DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all policies for all tables
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Normalize existing role values before RLS policies use get_user_role()
UPDATE public.tbl_users
SET role = CASE
  WHEN lower(trim(role)) = 'admin' THEN 'admin'
  ELSE 'user'
END
WHERE role IS DISTINCT FROM CASE
  WHEN lower(trim(role)) = 'admin' THEN 'admin'
  ELSE 'user'
END;

-- ============================================
-- STEP 2: Create helper function to get user role
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT lower(trim(role)) FROM public.tbl_users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.tbl_users (id, email, full_name, role, created_at)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.email, ''), 'missing-' || NEW.id::text),
    NULLIF(left(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 255)),
    'user',
    NEW.created_at
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.ensure_user_profile();

-- Ensure existing auth users without a profile can log in as regular users
INSERT INTO public.tbl_users (id, email, full_name, role, created_at)
SELECT
  au.id,
  COALESCE(NULLIF(au.email, ''), 'missing-' || au.id::text),
  NULLIF(left(COALESCE(au.raw_user_meta_data->>'full_name', ''), 255)),
  'user',
  au.created_at
FROM auth.users au
LEFT JOIN public.tbl_users tu ON tu.id = au.id
WHERE tu.id IS NULL;

-- ============================================
-- STEP 3: Enable RLS on all tables
-- ============================================
-- Enable RLS on all tables
ALTER TABLE public.tbl_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tbl_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tbl_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tbl_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tbl_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tbl_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tbl_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tbl_ticket_types ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Create tbl_users table policies
-- ============================================

-- Allow users to SELECT their own record
CREATE POLICY "tbl_users_select_own"
ON public.tbl_users FOR SELECT
USING (auth.uid() = id);

-- All authenticated users can view users
CREATE POLICY "tbl_users_select_all_authenticated"
ON public.tbl_users FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Admins can view all users
CREATE POLICY "tbl_users_select_admin"
ON public.tbl_users FOR SELECT
USING (public.get_user_role() = 'admin');

-- Allow users to INSERT their own record (for new signups)
CREATE POLICY "tbl_users_insert_own"
ON public.tbl_users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to UPDATE their own record
CREATE POLICY "tbl_users_update_own"
ON public.tbl_users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins can update any user (for role changes)
CREATE POLICY "tbl_users_update_admin"
ON public.tbl_users FOR UPDATE
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

-- Admins can delete users
CREATE POLICY "tbl_users_delete_admin"
ON public.tbl_users FOR DELETE
USING (public.get_user_role() = 'admin');

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
-- STEP 6: Create tbl_comments table policies
-- ============================================

-- All authenticated users can view comments
CREATE POLICY "tbl_comments_select_all_authenticated"
ON public.tbl_comments FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can insert comments
CREATE POLICY "tbl_comments_insert_authenticated"
ON public.tbl_comments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- STEP 6b: Create tbl_feedback table policies
-- ============================================

-- Users can insert their own feedback
CREATE POLICY "tbl_feedback_insert_own"
ON public.tbl_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
 CREATE POLICY "tbl_feedback_select_own"
 ON public.tbl_feedback FOR SELECT
 USING (auth.uid() = user_id);

 -- Admins can view all feedback
 CREATE POLICY "tbl_feedback_select_admin"
 ON public.tbl_feedback FOR SELECT
 USING (public.get_user_role() = 'admin');

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
    COALESCE(
      AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) FILTER (WHERE status = 'SOLVED'),
      0
    )::numeric(10,2) AS avg_resolution_hours
FROM public.tbl_tickets;

-- Grant access to authenticated users
GRANT SELECT ON public.tbl_ticket_analytics TO authenticated;

-- ============================================
-- STEP 7b: Enable RLS on tbl_contacts and add policies
-- ============================================
ALTER TABLE IF EXISTS public.tbl_contacts ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view contacts
CREATE POLICY "tbl_contacts_select_all_authenticated"
ON public.tbl_contacts FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Admins can insert contacts
CREATE POLICY "tbl_contacts_insert_admin"
ON public.tbl_contacts FOR INSERT
WITH CHECK (public.get_user_role() = 'admin');

-- Admins can update contacts
CREATE POLICY "tbl_contacts_update_admin"
ON public.tbl_contacts FOR UPDATE
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

-- Admins can delete contacts
CREATE POLICY "tbl_contacts_delete_admin"
ON public.tbl_contacts FOR DELETE
USING (public.get_user_role() = 'admin');

-- ============================================
-- STEP 8: Categories, Tags, and Ticket Types policies
-- ============================================

-- Categories: All authenticated users can view, admins can manage
CREATE POLICY "tbl_categories_select_all"
ON public.tbl_categories FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "tbl_categories_insert_admin"
ON public.tbl_categories FOR INSERT
WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "tbl_categories_update_admin"
ON public.tbl_categories FOR UPDATE
USING (public.get_user_role() = 'admin');

CREATE POLICY "tbl_categories_delete_admin"
ON public.tbl_categories FOR DELETE
USING (public.get_user_role() = 'admin');

-- Tags: All authenticated users can view, admins can manage
CREATE POLICY "tbl_tags_select_all"
ON public.tbl_tags FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "tbl_tags_insert_admin"
ON public.tbl_tags FOR INSERT
WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "tbl_tags_update_admin"
ON public.tbl_tags FOR UPDATE
USING (public.get_user_role() = 'admin');

CREATE POLICY "tbl_tags_delete_admin"
ON public.tbl_tags FOR DELETE
USING (public.get_user_role() = 'admin');

-- Ticket Types: All authenticated users can view, admins can manage
CREATE POLICY "tbl_ticket_types_select_all"
ON public.tbl_ticket_types FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "tbl_ticket_types_insert_admin"
ON public.tbl_ticket_types FOR INSERT
WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "tbl_ticket_types_update_admin"
ON public.tbl_ticket_types FOR UPDATE
USING (public.get_user_role() = 'admin');

CREATE POLICY "tbl_ticket_types_delete_admin"
ON public.tbl_ticket_types FOR DELETE
USING (public.get_user_role() = 'admin');

-- ============================================
-- STEP 8: Create triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_tbl_tickets_updated_at ON public.tbl_tickets;
CREATE TRIGGER update_tbl_tickets_updated_at
    BEFORE UPDATE ON public.tbl_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tbl_comments_updated_at ON public.tbl_comments;
CREATE TRIGGER update_tbl_comments_updated_at
    BEFORE UPDATE ON public.tbl_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- STEP 9: Create Storage bucket for attachments
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket-attachments',
  'ticket-attachments',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'application/pdf', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "ticket_attachments_select_authenticated" ON storage.objects;
CREATE POLICY "ticket_attachments_select_authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ticket-attachments');

DROP POLICY IF EXISTS "ticket_attachments_insert_authenticated" ON storage.objects;
CREATE POLICY "ticket_attachments_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "ticket_attachments_delete_authenticated" ON storage.objects;
CREATE POLICY "ticket_attachments_delete_authenticated"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ticket-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1
      FROM public.tbl_users
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  )
);

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
