-- ============================================
-- MIGRATION: Remove saved replies and mentions
-- Run this in Supabase SQL Editor
-- ============================================

DROP TABLE IF EXISTS public.tbl_saved_replies CASCADE;
DROP TABLE IF EXISTS public.tbl_notifications CASCADE;

ALTER TABLE public.tbl_comments
DROP COLUMN IF EXISTS commenter_email;
