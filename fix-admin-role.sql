UPDATE public.tbl_users
SET role = 'admin'
WHERE id = '81822da5-ec31-4b94-8712-28e00a611040';

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'),
  '{role}',
  '"admin"'
)
WHERE id = '81822da5-ec31-4b94-8712-28e00a611040';

SELECT id, email, role FROM public.tbl_users WHERE id = '81822da5-ec31-4b94-8712-28e00a611040';
