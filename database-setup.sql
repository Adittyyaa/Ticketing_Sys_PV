-- ============================================
-- TICKETING SYSTEM - COMPLETE DATABASE SETUP
-- Supabase PostgreSQL
-- Safe to run multiple times (idempotent)
-- ============================================

-- ============================================
-- STEP 1: Create tables if not exist
-- ============================================

CREATE TABLE IF NOT EXISTS public.tbl_users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' NOT NULL,
  phone VARCHAR(50),
  job_title VARCHAR(255),
  company VARCHAR(255),
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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tbl_solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  steps TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'General' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tbl_custom_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

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

-- ============================================
-- STEP 2: Add missing columns to existing tables if not present
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_users' AND column_name = 'phone') THEN
    ALTER TABLE public.tbl_users ADD COLUMN phone VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_users' AND column_name = 'job_title') THEN
    ALTER TABLE public.tbl_users ADD COLUMN job_title VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_users' AND column_name = 'company') THEN
    ALTER TABLE public.tbl_users ADD COLUMN company VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_attachments' AND column_name = 'uploaded_by') THEN
    ALTER TABLE public.tbl_attachments ADD COLUMN uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_attachments' AND column_name = 'user_id') THEN
    ALTER TABLE public.tbl_attachments ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_tickets' AND column_name = 'assigned_to') THEN
    ALTER TABLE public.tbl_tickets ADD COLUMN assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_tickets' AND column_name = 'type') THEN
    ALTER TABLE public.tbl_tickets ADD COLUMN type VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_tickets' AND column_name = 'product') THEN
    ALTER TABLE public.tbl_tickets ADD COLUMN product VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_tickets' AND column_name = 'product_reference_number') THEN
    ALTER TABLE public.tbl_tickets ADD COLUMN product_reference_number VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_comments' AND column_name = 'commenter_name') THEN
    ALTER TABLE public.tbl_comments ADD COLUMN commenter_name VARCHAR(255);
  END IF;
END $$;

-- ============================================
-- STEP 3: Add unique constraints if not present
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tbl_categories_name_key') THEN
    ALTER TABLE public.tbl_categories ADD CONSTRAINT tbl_categories_name_key UNIQUE (name);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tbl_tags_name_key') THEN
    ALTER TABLE public.tbl_tags ADD CONSTRAINT tbl_tags_name_key UNIQUE (name);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tbl_ticket_types_name_key') THEN
    ALTER TABLE public.tbl_ticket_types ADD CONSTRAINT tbl_ticket_types_name_key UNIQUE (name);
  END IF;
END $$;

-- ============================================
-- STEP 4: Helper Functions
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
    NULLIF(left(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 255), ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'user'),
    NEW.created_at
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- ============================================
-- STEP 5: Triggers
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_profile();

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

DROP TRIGGER IF EXISTS update_tbl_solutions_updated_at ON public.tbl_solutions;
CREATE TRIGGER update_tbl_solutions_updated_at
  BEFORE UPDATE ON public.tbl_solutions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- STEP 6: Enable RLS on all tables
-- ============================================

ALTER TABLE public.tbl_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_custom_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_contacts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 7: RLS Policies (drop then recreate)
-- ============================================

-- tbl_users policies
DROP POLICY IF EXISTS "tbl_users_select_own" ON public.tbl_users;
DROP POLICY IF EXISTS "tbl_users_select_all_authenticated" ON public.tbl_users;
DROP POLICY IF EXISTS "tbl_users_select_admin" ON public.tbl_users;
DROP POLICY IF EXISTS "tbl_users_insert_own" ON public.tbl_users;
DROP POLICY IF EXISTS "tbl_users_update_own" ON public.tbl_users;
DROP POLICY IF EXISTS "tbl_users_update_admin" ON public.tbl_users;
DROP POLICY IF EXISTS "tbl_users_delete_admin" ON public.tbl_users;

CREATE POLICY "tbl_users_select_own"
  ON public.tbl_users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "tbl_users_select_all_authenticated"
  ON public.tbl_users FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "tbl_users_select_admin"
  ON public.tbl_users FOR SELECT
  USING (public.get_user_role() = 'admin');

CREATE POLICY "tbl_users_insert_own"
  ON public.tbl_users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "tbl_users_update_own"
  ON public.tbl_users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "tbl_users_update_admin"
  ON public.tbl_users FOR UPDATE
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "tbl_users_delete_admin"
  ON public.tbl_users FOR DELETE
  USING (public.get_user_role() = 'admin');

-- tbl_tickets policies
DROP POLICY IF EXISTS "tbl_tickets_select_all_authenticated" ON public.tbl_tickets;
DROP POLICY IF EXISTS "tbl_tickets_insert_own" ON public.tbl_tickets;
DROP POLICY IF EXISTS "tbl_tickets_update_own_or_admin" ON public.tbl_tickets;
DROP POLICY IF EXISTS "tbl_tickets_delete_own_or_admin" ON public.tbl_tickets;

CREATE POLICY "tbl_tickets_select_all_authenticated"
  ON public.tbl_tickets FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "tbl_tickets_insert_own"
  ON public.tbl_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tbl_tickets_update_own_or_admin"
  ON public.tbl_tickets FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR auth.uid() = assigned_to 
    OR public.get_user_role() = 'admin'
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR auth.uid() = assigned_to 
    OR public.get_user_role() = 'admin'
  );

CREATE POLICY "tbl_tickets_delete_own_or_admin"
  ON public.tbl_tickets FOR DELETE
  USING (auth.uid() = user_id OR public.get_user_role() = 'admin');

-- tbl_comments policies
DROP POLICY IF EXISTS "tbl_comments_select_all_authenticated" ON public.tbl_comments;
DROP POLICY IF EXISTS "tbl_comments_insert_authenticated" ON public.tbl_comments;

CREATE POLICY "tbl_comments_select_all_authenticated"
  ON public.tbl_comments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "tbl_comments_insert_authenticated"
  ON public.tbl_comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- tbl_attachments policies
DROP POLICY IF EXISTS "tbl_attachments_select_all_authenticated" ON public.tbl_attachments;

CREATE POLICY "tbl_attachments_select_all_authenticated"
  ON public.tbl_attachments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- tbl_solutions policies
DROP POLICY IF EXISTS "tbl_solutions_select_all_authenticated" ON public.tbl_solutions;
DROP POLICY IF EXISTS "tbl_solutions_insert_admin" ON public.tbl_solutions;
DROP POLICY IF EXISTS "tbl_solutions_update_admin" ON public.tbl_solutions;
DROP POLICY IF EXISTS "tbl_solutions_delete_admin" ON public.tbl_solutions;

CREATE POLICY "tbl_solutions_select_all_authenticated"
  ON public.tbl_solutions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "tbl_solutions_insert_admin"
  ON public.tbl_solutions FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "tbl_solutions_update_admin"
  ON public.tbl_solutions FOR UPDATE
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "tbl_solutions_delete_admin"
  ON public.tbl_solutions FOR DELETE
  USING (public.get_user_role() = 'admin');

-- tbl_custom_statuses policies
DROP POLICY IF EXISTS "tbl_custom_statuses_select_all_authenticated" ON public.tbl_custom_statuses;
DROP POLICY IF EXISTS "tbl_custom_statuses_insert_admin" ON public.tbl_custom_statuses;
DROP POLICY IF EXISTS "tbl_custom_statuses_update_admin" ON public.tbl_custom_statuses;
DROP POLICY IF EXISTS "tbl_custom_statuses_delete_admin" ON public.tbl_custom_statuses;

CREATE POLICY "tbl_custom_statuses_select_all_authenticated"
  ON public.tbl_custom_statuses FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "tbl_custom_statuses_insert_admin"
  ON public.tbl_custom_statuses FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "tbl_custom_statuses_update_admin"
  ON public.tbl_custom_statuses FOR UPDATE
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "tbl_custom_statuses_delete_admin"
  ON public.tbl_custom_statuses FOR DELETE
  USING (public.get_user_role() = 'admin');

-- tbl_categories policies
DROP POLICY IF EXISTS "tbl_categories_select_all" ON public.tbl_categories;
DROP POLICY IF EXISTS "tbl_categories_insert_admin" ON public.tbl_categories;
DROP POLICY IF EXISTS "tbl_categories_update_admin" ON public.tbl_categories;
DROP POLICY IF EXISTS "tbl_categories_delete_admin" ON public.tbl_categories;

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

-- tbl_tags policies
DROP POLICY IF EXISTS "tbl_tags_select_all" ON public.tbl_tags;
DROP POLICY IF EXISTS "tbl_tags_insert_admin" ON public.tbl_tags;
DROP POLICY IF EXISTS "tbl_tags_update_admin" ON public.tbl_tags;
DROP POLICY IF EXISTS "tbl_tags_delete_admin" ON public.tbl_tags;

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

-- tbl_ticket_types policies
DROP POLICY IF EXISTS "tbl_ticket_types_select_all" ON public.tbl_ticket_types;
DROP POLICY IF EXISTS "tbl_ticket_types_insert_admin" ON public.tbl_ticket_types;
DROP POLICY IF EXISTS "tbl_ticket_types_update_admin" ON public.tbl_ticket_types;
DROP POLICY IF EXISTS "tbl_ticket_types_delete_admin" ON public.tbl_ticket_types;

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

-- tbl_feedback policies
DROP POLICY IF EXISTS "tbl_feedback_insert_own" ON public.tbl_feedback;
DROP POLICY IF EXISTS "tbl_feedback_select_own" ON public.tbl_feedback;
DROP POLICY IF EXISTS "tbl_feedback_select_admin" ON public.tbl_feedback;

CREATE POLICY "tbl_feedback_insert_own"
  ON public.tbl_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tbl_feedback_select_own"
  ON public.tbl_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "tbl_feedback_select_admin"
  ON public.tbl_feedback FOR SELECT
  USING (public.get_user_role() = 'admin');

-- tbl_contacts policies
DROP POLICY IF EXISTS "tbl_contacts_select_all_authenticated" ON public.tbl_contacts;
DROP POLICY IF EXISTS "tbl_contacts_insert_admin" ON public.tbl_contacts;
DROP POLICY IF EXISTS "tbl_contacts_update_admin" ON public.tbl_contacts;
DROP POLICY IF EXISTS "tbl_contacts_delete_admin" ON public.tbl_contacts;

CREATE POLICY "tbl_contacts_select_all_authenticated"
  ON public.tbl_contacts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "tbl_contacts_insert_admin"
  ON public.tbl_contacts FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "tbl_contacts_update_admin"
  ON public.tbl_contacts FOR UPDATE
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "tbl_contacts_delete_admin"
  ON public.tbl_contacts FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ============================================
-- STEP 8: Storage Bucket for Attachments
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
        SELECT 1 FROM public.tbl_users WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- ============================================
-- STEP 9: Analytics View
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

GRANT SELECT ON public.tbl_ticket_analytics TO authenticated;

-- ============================================
-- STEP 10: Cleanup legacy tables and constraints
-- ============================================

-- Drop legacy tables if they exist
DROP TABLE IF EXISTS public.tbl_saved_replies CASCADE;
DROP TABLE IF EXISTS public.tbl_notifications CASCADE;

-- Drop legacy columns if they exist
ALTER TABLE public.tbl_comments DROP COLUMN IF EXISTS commenter_email;

-- Drop any accidentally-added check constraints on tbl_tickets
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT conname FROM pg_constraint 
            WHERE conrelid = 'public.tbl_tickets'::regclass 
            AND contype = 'c') LOOP
    EXECUTE 'ALTER TABLE public.tbl_tickets DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- Drop valid_category if it exists (kept for idempotency)
ALTER TABLE IF EXISTS public.tbl_tickets DROP CONSTRAINT IF EXISTS valid_category;

-- Drop valid_status if it exists (kept for idempotency)
ALTER TABLE IF EXISTS public.tbl_tickets DROP CONSTRAINT IF EXISTS valid_status;

-- ============================================
-- STEP 11: Seed reference data
-- ============================================

INSERT INTO public.tbl_categories (name, created_at) VALUES
  ('Bug Report', NOW()),
  ('Technical Issue', NOW()),
  ('Account Inquiry', NOW()),
  ('New Feature Request', NOW()),
  ('Other', NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.tbl_tags (name, created_at) VALUES
  ('frontend', NOW()),
  ('backend', NOW()),
  ('urgent', NOW()),
  ('documentation', NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.tbl_ticket_types (name, description, created_at) VALUES
  ('Feature Request', 'Request for new functionality', NOW()),
  ('Bug Report', 'Report of a software defect', NOW()),
  ('Support Ticket', 'General support inquiry', NOW())
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- STEP 12: Verification
-- ============================================

SELECT 'Database setup complete!' as status;

SELECT 'tbl_users' as table_name,
  (SELECT COUNT(*) FROM tbl_users) as row_count
UNION ALL
SELECT 'tbl_tickets',
  (SELECT COUNT(*) FROM tbl_tickets)
UNION ALL
SELECT 'tbl_comments',
  (SELECT COUNT(*) FROM tbl_comments)
UNION ALL
SELECT 'tbl_attachments',
  (SELECT COUNT(*) FROM tbl_attachments)
UNION ALL
SELECT 'tbl_solutions',
  (SELECT COUNT(*) FROM tbl_solutions)
UNION ALL
SELECT 'tbl_custom_statuses',
  (SELECT COUNT(*) FROM tbl_custom_statuses)
UNION ALL
SELECT 'tbl_categories',
  (SELECT COUNT(*) FROM tbl_categories)
UNION ALL
SELECT 'tbl_tags',
  (SELECT COUNT(*) FROM tbl_tags)
UNION ALL
SELECT 'tbl_ticket_types',
  (SELECT COUNT(*) FROM tbl_ticket_types)
UNION ALL
SELECT 'tbl_feedback',
  (SELECT COUNT(*) FROM tbl_feedback)
UNION ALL
SELECT 'tbl_contacts',
  (SELECT COUNT(*) FROM tbl_contacts);
