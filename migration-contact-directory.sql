-- ============================================
-- MIGRATION: Employee contact directory
-- Run this in Supabase SQL Editor
-- ============================================

ALTER TABLE public.tbl_contacts
ADD COLUMN IF NOT EXISTS department VARCHAR(255);

-- Contact records are stored separately from tbl_users.
-- The contacts page should read from tbl_contacts only.
