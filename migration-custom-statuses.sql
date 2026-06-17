-- ============================================
-- MIGRATION: Add custom statuses table
-- Run this in Supabase SQL Editor
-- ============================================

-- Create tbl_custom_statuses table
CREATE TABLE IF NOT EXISTS public.tbl_custom_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on tbl_custom_statuses
ALTER TABLE public.tbl_custom_statuses ENABLE ROW LEVEL SECURITY;

-- Policies for tbl_custom_statuses
DROP POLICY IF EXISTS "tbl_custom_statuses_select_all_authenticated" ON public.tbl_custom_statuses;
CREATE POLICY "tbl_custom_statuses_select_all_authenticated"
ON public.tbl_custom_statuses FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "tbl_custom_statuses_insert_admin" ON public.tbl_custom_statuses;
CREATE POLICY "tbl_custom_statuses_insert_admin"
ON public.tbl_custom_statuses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tbl_users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "tbl_custom_statuses_update_admin" ON public.tbl_custom_statuses;
CREATE POLICY "tbl_custom_statuses_update_admin"
ON public.tbl_custom_statuses FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.tbl_users 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tbl_users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "tbl_custom_statuses_delete_admin" ON public.tbl_custom_statuses;
CREATE POLICY "tbl_custom_statuses_delete_admin"
ON public.tbl_custom_statuses FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.tbl_users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Verification
SELECT 'Custom statuses table created!' as status;

SELECT 'Custom statuses available:' as info, COUNT(*) as count FROM public.tbl_custom_statuses;