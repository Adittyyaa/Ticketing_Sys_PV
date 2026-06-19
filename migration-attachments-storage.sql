-- ============================================
-- MIGRATION: Attachments storage bucket and policies
-- Run this in Supabase SQL Editor
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
      SELECT 1
      FROM public.tbl_users
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  )
);
