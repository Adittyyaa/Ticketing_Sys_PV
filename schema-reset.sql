-- ============================================
-- TICKETING SYSTEM - CLEAN DATABASE SCHEMA
-- Run this in Supabase SQL Editor to reset and setup
-- ============================================

-- ============================================
-- HELPER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.tbl_users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- TABLE: tbl_users
-- ============================================
DROP TABLE IF EXISTS public.tbl_users CASCADE;
CREATE TABLE public.tbl_users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.tbl_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tbl_users_select_all_authenticated" ON public.tbl_users FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "tbl_users_insert_own" ON public.tbl_users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "tbl_users_update_own" ON public.tbl_users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "tbl_users_update_admin" ON public.tbl_users FOR UPDATE USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "tbl_users_delete_admin" ON public.tbl_users FOR DELETE USING (public.get_user_role() = 'admin');

-- ============================================
-- TABLE: tbl_tickets
-- ============================================
DROP TABLE IF EXISTS public.tbl_tickets CASCADE;
CREATE TABLE public.tbl_tickets (
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

ALTER TABLE public.tbl_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tbl_tickets_select_all_authenticated" ON public.tbl_tickets FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "tbl_tickets_insert_own" ON public.tbl_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tbl_tickets_update_own_or_admin" ON public.tbl_tickets FOR UPDATE USING (auth.uid() = user_id OR public.get_user_role() = 'admin') WITH CHECK (auth.uid() = user_id OR public.get_user_role() = 'admin');
CREATE POLICY "tbl_tickets_delete_own_or_admin" ON public.tbl_tickets FOR DELETE USING (auth.uid() = user_id OR public.get_user_role() = 'admin');

-- ============================================
-- TABLE: tbl_comments
-- ============================================
DROP TABLE IF EXISTS public.tbl_comments CASCADE;
CREATE TABLE public.tbl_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tbl_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  commenter_name VARCHAR(255),
  commenter_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.tbl_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tbl_comments_select_all_authenticated" ON public.tbl_comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "tbl_comments_insert_authenticated" ON public.tbl_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- TABLE: tbl_attachments
-- ============================================
DROP TABLE IF EXISTS public.tbl_attachments CASCADE;
CREATE TABLE public.tbl_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tbl_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.tbl_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tbl_attachments_select_all_authenticated" ON public.tbl_attachments FOR SELECT USING (auth.uid() IS NOT NULL);

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
-- TABLE: tbl_notifications
-- ============================================
DROP TABLE IF EXISTS public.tbl_notifications CASCADE;
CREATE TABLE public.tbl_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES public.tbl_tickets(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.tbl_comments(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL DEFAULT 'mention',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  ticket_number INTEGER,
  ticket_title VARCHAR(255),
  commenter_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.tbl_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tbl_notifications_select_own" ON public.tbl_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tbl_notifications_insert_authed" ON public.tbl_notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "tbl_notifications_update_own" ON public.tbl_notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tbl_notifications_delete_own" ON public.tbl_notifications FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_id ON public.tbl_notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.tbl_notifications(is_read);

-- ============================================
-- TABLE: tbl_solutions
-- ============================================
DROP TABLE IF EXISTS public.tbl_solutions CASCADE;
CREATE TABLE public.tbl_solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  steps TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'General' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.tbl_solutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tbl_solutions_select_all_authenticated" ON public.tbl_solutions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "tbl_solutions_insert_admin" ON public.tbl_solutions FOR INSERT WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "tbl_solutions_update_admin" ON public.tbl_solutions FOR UPDATE USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "tbl_solutions_delete_admin" ON public.tbl_solutions FOR DELETE USING (public.get_user_role() = 'admin');

-- ============================================
-- TABLE: tbl_custom_statuses
-- ============================================
DROP TABLE IF EXISTS public.tbl_custom_statuses CASCADE;
CREATE TABLE public.tbl_custom_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.tbl_custom_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tbl_custom_statuses_select_all_authenticated" ON public.tbl_custom_statuses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "tbl_custom_statuses_insert_admin" ON public.tbl_custom_statuses FOR INSERT WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "tbl_custom_statuses_update_admin" ON public.tbl_custom_statuses FOR UPDATE USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "tbl_custom_statuses_delete_admin" ON public.tbl_custom_statuses FOR DELETE USING (public.get_user_role() = 'admin');

-- ============================================
-- TABLE: tbl_categories
-- ============================================
DROP TABLE IF EXISTS public.tbl_categories CASCADE;
CREATE TABLE public.tbl_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.tbl_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tbl_categories_select_all" ON public.tbl_categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "tbl_categories_insert_admin" ON public.tbl_categories FOR INSERT WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "tbl_categories_update_admin" ON public.tbl_categories FOR UPDATE USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "tbl_categories_delete_admin" ON public.tbl_categories FOR DELETE USING (public.get_user_role() = 'admin');

-- ============================================
-- TABLE: tbl_saved_replies
-- ============================================
DROP TABLE IF EXISTS public.tbl_saved_replies CASCADE;
CREATE TABLE public.tbl_saved_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.tbl_saved_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tbl_saved_replies_select_all" ON public.tbl_saved_replies FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "tbl_saved_replies_insert_admin" ON public.tbl_saved_replies FOR INSERT WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "tbl_saved_replies_update_admin" ON public.tbl_saved_replies FOR UPDATE USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "tbl_saved_replies_delete_admin" ON public.tbl_saved_replies FOR DELETE USING (public.get_user_role() = 'admin');

-- ============================================
-- TABLE: tbl_contacts
-- ============================================
DROP TABLE IF EXISTS public.tbl_contacts CASCADE;
CREATE TABLE public.tbl_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  position VARCHAR(255),
  department VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.tbl_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tbl_contacts_select_all_authenticated" ON public.tbl_contacts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "tbl_contacts_insert_admin" ON public.tbl_contacts FOR INSERT WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "tbl_contacts_update_admin" ON public.tbl_contacts FOR UPDATE USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "tbl_contacts_delete_admin" ON public.tbl_contacts FOR DELETE USING (public.get_user_role() = 'admin');

-- ============================================
-- TABLE: tbl_feedback (optional - for feedback feature)
-- ============================================
DROP TABLE IF EXISTS public.tbl_feedback CASCADE;
CREATE TABLE public.tbl_feedback (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.tbl_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tbl_feedback_insert_own" ON public.tbl_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tbl_feedback_select_own" ON public.tbl_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tbl_feedback_select_admin" ON public.tbl_feedback FOR SELECT USING (public.get_user_role() = 'admin');

-- ============================================
-- ANALYTICS VIEW
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
  COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) FILTER (WHERE status = 'SOLVED')::numeric(10,2) as avg_resolution_hours
FROM public.tbl_tickets;

GRANT SELECT ON public.tbl_ticket_analytics TO authenticated;

-- ============================================
-- TRIGGER: updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_tbl_tickets_updated_at BEFORE UPDATE ON public.tbl_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tbl_comments_updated_at BEFORE UPDATE ON public.tbl_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tbl_solutions_updated_at BEFORE UPDATE ON public.tbl_solutions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Schema reset complete!' as status;

SELECT 
  'tbl_users' as table_name,
  (SELECT COUNT(*) FROM tbl_users) as row_count
UNION ALL
SELECT 
  'tbl_tickets',
  (SELECT COUNT(*) FROM tbl_tickets)
UNION ALL
SELECT 
  'tbl_comments',
  (SELECT COUNT(*) FROM tbl_comments)
UNION ALL
SELECT 
  'tbl_attachments',
  (SELECT COUNT(*) FROM tbl_attachments)
UNION ALL
SELECT 
  'tbl_notifications',
  (SELECT COUNT(*) FROM tbl_notifications)
UNION ALL
SELECT 
  'tbl_solutions',
  (SELECT COUNT(*) FROM tbl_solutions)
UNION ALL
SELECT 
  'tbl_custom_statuses',
  (SELECT COUNT(*) FROM tbl_custom_statuses)
UNION ALL
SELECT 
  'tbl_categories',
  (SELECT COUNT(*) FROM tbl_categories)
UNION ALL
SELECT 
  'tbl_saved_replies',
  (SELECT COUNT(*) FROM tbl_saved_replies);