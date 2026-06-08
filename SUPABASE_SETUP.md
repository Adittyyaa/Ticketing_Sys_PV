# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Set your project name and database password
5. Wait for the project to initialize

## 2. Get Your Credentials

1. In your Supabase dashboard, go to **Settings → API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Paste these into `.env.local`

## 3. Create Database Tables

Go to **SQL Editor** in your Supabase dashboard and run this SQL:

```sql
-- Create users table to store user roles
CREATE TABLE public.tbl_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  job_title VARCHAR(255),
  company VARCHAR(255) DEFAULT 'PV Advisory',
  avatar_url TEXT,
  bio TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_role CHECK (role IN ('user', 'admin'))
);

-- Create tickets table
CREATE TABLE public.tbl_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number BIGSERIAL UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  status VARCHAR(20) NOT NULL DEFAULT 'UNTOUCHED',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  CONSTRAINT valid_status CHECK (status IN ('UNTOUCHED', 'PENDING', 'OPENED', 'SOLVED')),
  CONSTRAINT valid_category CHECK (category IN ('Bug Report', 'Technical Issue', 'Account Inquiry', 'New Feature Request', 'Other'))
);

-- Create comments table
CREATE TABLE public.tbl_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tbl_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  commenter_name VARCHAR(255),
  commenter_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create attachments table
CREATE TABLE public.tbl_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tbl_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_tickets_user_id ON public.tbl_tickets(user_id);
CREATE INDEX idx_tickets_status ON public.tbl_tickets(status);
CREATE INDEX idx_tickets_priority ON public.tbl_tickets(priority);
CREATE INDEX idx_tickets_created_at ON public.tbl_tickets(created_at DESC);
CREATE INDEX idx_users_role ON public.tbl_users(role);
CREATE INDEX idx_comments_ticket_id ON public.tbl_comments(ticket_id);
CREATE INDEX idx_attachments_ticket_id ON public.tbl_attachments(ticket_id);

-- Enable Row Level Security
ALTER TABLE public.tbl_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tbl_users' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.tbl_users';
    END LOOP;
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tbl_tickets' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.tbl_tickets';
    END LOOP;
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tbl_comments' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.tbl_comments';
    END LOOP;
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tbl_attachments' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.tbl_attachments';
    END LOOP;
END $$;

-- Create helper function to get user role (cached for performance)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.tbl_users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- tbl_users RLS Policies
-- ============================================

-- Users can view their own profile
CREATE POLICY "tbl_users_select_own"
ON public.tbl_users FOR SELECT
USING (auth.uid() = id);

-- Users can insert their own record
CREATE POLICY "tbl_users_insert_own"
ON public.tbl_users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own record
CREATE POLICY "tbl_users_update_own"
ON public.tbl_users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- tbl_tickets RLS Policies
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
-- tbl_comments RLS Policies
-- ============================================

-- All authenticated users can view comments
CREATE POLICY "tbl_comments_select_all"
ON public.tbl_comments FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can insert comments
CREATE POLICY "tbl_comments_insert_own"
ON public.tbl_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments, admins can delete any
CREATE POLICY "tbl_comments_delete_own_or_admin"
ON public.tbl_comments FOR DELETE
USING (auth.uid() = user_id OR public.get_user_role() = 'admin');

-- ============================================
-- tbl_attachments RLS Policies
-- ============================================

-- All authenticated users can view attachments
CREATE POLICY "tbl_attachments_select_all"
ON public.tbl_attachments FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can upload attachments to their tickets
CREATE POLICY "tbl_attachments_insert_own"
ON public.tbl_attachments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own attachments, admins can delete any
CREATE POLICY "tbl_attachments_delete_own_or_admin"
ON public.tbl_attachments FOR DELETE
USING (auth.uid() = user_id OR public.get_user_role() = 'admin');

-- Create index for faster queries
CREATE INDEX idx_tickets_user_id ON public.tbl_tickets(user_id);
CREATE INDEX idx_tickets_status ON public.tbl_tickets(status);
CREATE INDEX idx_tickets_priority ON public.tbl_tickets(priority);
CREATE INDEX idx_tickets_created_at ON public.tbl_tickets(created_at DESC);
CREATE INDEX idx_users_role ON public.tbl_users(role);
CREATE INDEX idx_comments_ticket_id ON public.tbl_comments(ticket_id);
CREATE INDEX idx_attachments_ticket_id ON public.tbl_attachments(ticket_id);
```

## 4. Enable Authentication

1. Go to **Authentication → Providers**
2. Enable **Email** (already enabled by default)
3. Configure email settings if needed

## 5. Environment Variables

Create `.env.local` in your project root:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

That's it! Your Supabase database is ready.
