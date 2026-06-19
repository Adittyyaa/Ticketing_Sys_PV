-- ============================================
-- MIGRATION: Enhance tickets with assignment and new columns
-- Run this in Supabase SQL Editor
-- ============================================

-- Add new columns to tbl_tickets
ALTER TABLE public.tbl_tickets 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.tbl_tickets 
ADD COLUMN IF NOT EXISTS type VARCHAR(100);
ALTER TABLE public.tbl_tickets 
ADD COLUMN IF NOT EXISTS product VARCHAR(100);

ALTER TABLE public.tbl_tickets 
ADD COLUMN IF NOT EXISTS product_reference_number VARCHAR(100);

-- Create tbl_ticket_types table for predefined types
CREATE TABLE IF NOT EXISTS public.tbl_ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on tbl_ticket_types
ALTER TABLE public.tbl_ticket_types ENABLE ROW LEVEL SECURITY;

-- Policies for tbl_ticket_types
DROP POLICY IF EXISTS "tbl_ticket_types_select_all_authenticated" ON public.tbl_ticket_types;
CREATE POLICY "tbl_ticket_types_select_all_authenticated"
ON public.tbl_ticket_types FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "tbl_ticket_types_insert_admin" ON public.tbl_ticket_types;
CREATE POLICY "tbl_ticket_types_insert_admin"
ON public.tbl_ticket_types FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tbl_users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Insert default ticket types
INSERT INTO public.tbl_ticket_types (name, description) VALUES
  ('Support Request', 'General support inquiry or assistance needed'),
  ('Technical Issue', 'Technical problems or system errors'),
  ('Feature Request', 'Request for new features or enhancements'),
  ('Bug Report', 'Report of software bugs or defects'),
  ('Account Issue', 'Problems related to user accounts'),
  ('Billing Query', 'Questions about billing or payments'),
  ('Integration', 'Integration with third-party services'),
  ('Configuration', 'System or product configuration requests'),
  ('Documentation', 'Documentation related requests or updates'),
  ('Training', 'Training or educational support needed')
ON CONFLICT (name) DO NOTHING;

-- Update the tickets update policy to allow admins to assign tickets
DROP POLICY IF EXISTS "tbl_tickets_update_own_or_admin" ON public.tbl_tickets;
CREATE POLICY "tbl_tickets_update_own_or_admin"
ON public.tbl_tickets FOR UPDATE
USING (
  auth.uid() = user_id OR 
  auth.uid() = assigned_to OR
  EXISTS (
    SELECT 1 FROM public.tbl_users 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = user_id OR 
  auth.uid() = assigned_to OR
  EXISTS (
    SELECT 1 FROM public.tbl_users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Verification
SELECT 'Migration complete!' as status;

SELECT 'New columns added:' as info,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_tickets' AND column_name = 'assigned_to') as assigned_to_exists,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_tickets' AND column_name = 'type') as type_exists,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_tickets' AND column_name = 'product') as product_exists,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_tickets' AND column_name = 'product_reference_number') as product_reference_exists;

SELECT 'Ticket types available:' as info, COUNT(*) as count FROM public.tbl_ticket_types;

SELECT '✅ Enhancement complete! Refresh your application.' as result;
