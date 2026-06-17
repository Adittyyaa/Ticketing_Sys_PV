-- ============================================
-- Notifications table for mentions and updates
-- ============================================

CREATE TABLE IF NOT EXISTS public.tbl_notifications (
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

-- Enable RLS
ALTER TABLE IF EXISTS public.tbl_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if any
DROP POLICY IF EXISTS "tbl_notifications_select_own" ON public.tbl_notifications;
DROP POLICY IF EXISTS "tbl_notifications_insert_all" ON public.tbl_notifications;
DROP POLICY IF EXISTS "tbl_notifications_update_own" ON public.tbl_notifications;
DROP POLICY IF EXISTS "tbl_notifications_delete_own" ON public.tbl_notifications;

-- Policies
-- Users can view their own notifications
CREATE POLICY "tbl_notifications_select_own"
ON public.tbl_notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert notifications (for mentions)
CREATE POLICY "tbl_notifications_insert_all"
ON public.tbl_notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own notifications (mark as read)
CREATE POLICY "tbl_notifications_update_own"
ON public.tbl_notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "tbl_notifications_delete_own"
ON public.tbl_notifications FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.tbl_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.tbl_notifications(is_read);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tbl_notifications TO authenticated;