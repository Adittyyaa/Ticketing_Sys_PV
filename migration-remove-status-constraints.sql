-- ============================================
-- MIGRATION: Remove check constraints blocking custom categories/statuses
-- Run this in Supabase SQL Editor
-- ============================================

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

-- Verification
SELECT 'Migration complete! Check constraints on tbl_tickets:' as status;

SELECT conname, contype FROM pg_constraint 
WHERE conrelid = 'public.tbl_tickets'::regclass;
