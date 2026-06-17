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

-- Seed Saved Replies
INSERT INTO public.tbl_saved_replies (title, content, created_at, updated_at) VALUES
  ('Welcome', 'Thank you for reaching out. We''ll look into this shortly.', NOW(), NOW()),
  ('Resolved', 'This issue has been resolved in the latest update.', NOW(), NOW()),
  ('Follow-up', 'We''re still investigating this matter and will update you soon.', NOW(), NOW())
ON CONFLICT (title) DO NOTHING;

-- Verification
SELECT 'Seed data inserted successfully' as status;

-- Count records
SELECT 
  (SELECT COUNT(*) FROM tbl_categories) as categories_count,
  (SELECT COUNT(*) FROM tbl_tags) as tags_count,
  (SELECT COUNT(*) FROM tbl_ticket_types) as types_count,
  (SELECT COUNT(*) FROM tbl_saved_replies) as replies_count;