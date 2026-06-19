-- ============================================
-- Dummy Data Seed File for Testing
-- Run this in Supabase SQL Editor after database-setup.sql
-- ============================================

-- Seed Categories
INSERT INTO public.tbl_categories (name, created_at) VALUES
  ('Bug Report', NOW()),
  ('Technical Issue', NOW()),
  ('Account Inquiry', NOW()),
  ('New Feature Request', NOW()),
  ('Other', NOW())
ON CONFLICT (name) DO NOTHING;

-- Seed Tags
INSERT INTO public.tbl_tags (name, created_at) VALUES
  ('frontend', NOW()),
  ('backend', NOW()),
  ('urgent', NOW()),
  ('documentation', NOW())
ON CONFLICT (name) DO NOTHING;

-- Seed Ticket Types
INSERT INTO public.tbl_ticket_types (name, description, created_at) VALUES
  ('Feature Request', 'Request for new functionality', NOW()),
  ('Bug Report', 'Report of a software defect', NOW()),
  ('Support Ticket', 'General support inquiry', NOW())
ON CONFLICT (name) DO NOTHING;

-- Verification
SELECT 'Seed data inserted successfully' as status;

-- Count records
SELECT 
  (SELECT COUNT(*) FROM tbl_categories) as categories_count,
  (SELECT COUNT(*) FROM tbl_tags) as tags_count,
  (SELECT COUNT(*) FROM tbl_ticket_types) as types_count;