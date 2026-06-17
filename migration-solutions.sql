-- ============================================
-- SOLUTIONS (FAQ) TABLE SETUP
-- Run this in Supabase SQL Editor
-- ============================================

-- Create the table
CREATE TABLE IF NOT EXISTS public.tbl_solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  steps TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'General' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE IF EXISTS public.tbl_solutions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- All authenticated users can view solutions
CREATE POLICY "tbl_solutions_select_all_authenticated"
ON public.tbl_solutions FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Admins can insert solutions
CREATE POLICY "tbl_solutions_insert_admin"
ON public.tbl_solutions FOR INSERT
WITH CHECK (public.get_user_role() = 'admin');

-- Admins can update solutions
CREATE POLICY "tbl_solutions_update_admin"
ON public.tbl_solutions FOR UPDATE
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

-- Admins can delete solutions
CREATE POLICY "tbl_solutions_delete_admin"
ON public.tbl_solutions FOR DELETE
USING (public.get_user_role() = 'admin');

-- ============================================
-- UPDATE TRIGGER FOR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tbl_solutions_updated_at
    BEFORE UPDATE ON public.tbl_solutions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
