# Admin Ticket View Fix Guide

## Issue Summary
Admins cannot view past/other tickets on the admin dashboard.

## Root Cause Analysis

The RLS policy `tbl_tickets_select_all_authenticated` allows all authenticated users to view all tickets:

```sql
CREATE POLICY "tbl_tickets_select_all_authenticated"
ON public.tbl_tickets FOR SELECT
USING (auth.uid() IS NOT NULL);
```

This should work, but there might be additional issues:

1. **User is not in tbl_users table**: If the admin account exists in auth.users but not in tbl_users, the user won't be able to see the admin dashboard at all
2. **No tickets exist**: If there are no tickets in tbl_tickets, tabs will be empty
3. **RLS policies are disabled**: If RLS is disabled on tbl_tickets, the client might not return data
4. **Session not authenticated**: The Supabase session might be invalid

## Debugging Steps

### Step 1: Check Your Browser Console
1. Open your browser's Developer Tools (F12 or Cmd+Option+I)
2. Go to the Console tab
3. Log in as admin and navigate to `/admin`
4. Look for console logs from the admin page:
   - `Admin check - User data:` - Shows if admin user was found in tbl_users
   - `Fetching tickets for admin user:` - Shows admin ID being used
   - `Ticket fetch response:` - Shows if query succeeded or failed
   - `Total tickets fetched:` - Shows number of tickets returned

### Step 2: Verify Admin Account
Go to Supabase Dashboard:

1. **Authentication → Users**: Check if your admin email exists
   - Copy the UUID (this is the user's ID)

2. **Database → tbl_users**: Check if same UUID exists
   - Run SQL query:
   ```sql
   SELECT id, email, role FROM public.tbl_users WHERE id = 'YOUR-ADMIN-UUID';
   ```
   - Should return a row with `role = 'admin'`

### Step 3: Verify Tickets Exist
Run in Supabase SQL Editor:

```sql
-- Check total tickets
SELECT COUNT(*) as total_tickets FROM public.tbl_tickets;

-- Check tickets by user
SELECT user_id, COUNT(*) as count FROM public.tbl_tickets GROUP BY user_id;

-- Check specific ticket
SELECT id, title, user_id, created_at FROM public.tbl_tickets LIMIT 5;
```

### Step 4: Check RLS is Enabled
Run in Supabase SQL Editor:

```sql
-- Check if RLS is enabled on tbl_tickets
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tbl_tickets';

-- Should show: rowsecurity = true

-- Check all policies on tbl_tickets
SELECT schemaname, tablename, policyname, permissive, cmd, qual
FROM pg_policies 
WHERE tablename = 'tbl_tickets'
ORDER BY policyname;
```

### Step 5: Verify the get_user_role() Function
Run in Supabase SQL Editor:

```sql
-- Test the function (replace with actual admin UUID)
SELECT public.get_user_role() as role;

-- Should return: 'admin'

-- Or check directly:
SELECT role FROM public.tbl_users WHERE id = auth.uid();
```

## Common Issues & Solutions

### Issue: "No tickets found in this category"
**Possible Causes:**
- No tickets exist in tbl_tickets
- Tickets were created by the admin before creating other user accounts
- RLS policy is preventing access

**Solution:**
- Create a test ticket as a regular user
- Check browser console for error messages
- Verify tickets exist in database

### Issue: Error message displays on admin page
**Possible Causes:**
- Admin user not found in tbl_users
- Session expired
- Network error

**Solution:**
- Check console for detailed error
- Log out and log back in
- Verify admin account exists in Supabase

### Issue: Admin page redirects to /tickets
**Possible Cause:**
- User is not an admin (role ≠ 'admin' in tbl_users)

**Solution:**
- Verify user has role = 'admin' in tbl_users
- Contact system admin to promote account to admin

## Manual Fix: Create Test Data

If you need to test with sample data:

```sql
-- First, get your admin UUID (from Supabase Auth → Users)
-- Then insert test tickets from different users

-- Create a few test tickets
INSERT INTO public.tbl_tickets (number, title, description, category, priority, status, user_id, created_at, updated_at, tags)
VALUES
  (100, 'Test Ticket 1', 'This is a test ticket', 'Bug Report', 'MEDIUM', 'UNTOUCHED', 'USER-UUID-1', NOW(), NOW(), '{"test"}'),
  (101, 'Test Ticket 2', 'Another test ticket', 'Technical Issue', 'HIGH', 'PENDING', 'USER-UUID-2', NOW(), NOW(), '{"urgent"}'),
  (102, 'Test Ticket 3', 'Admin created ticket', 'Account Inquiry', 'LOW', 'OPENED', 'ADMIN-UUID', NOW(), NOW(), '{"info"}');
```

## New Error Handling in Code

The admin page now includes:
- **Loading state** while fetching tickets
- **Error display** if ticket fetch fails
- **Detailed console logging** for debugging
- **Empty state** if no tickets exist

All logs appear in browser console with prefix: "Fetching tickets for admin user"

## Testing the Fix

1. **Test with My Tickets:**
   - Create a ticket as admin (or any user)
   - Go to `/admin` → "My Tickets" tab
   - Should see the ticket with admin's ID

2. **Test with Other Tickets:**
   - Have another user create a ticket
   - Go to `/admin` → "Other Tickets" tab
   - Should see the other user's ticket

3. **Test with No Tickets:**
   - In "Other Tickets" tab with no non-admin tickets
   - Should see message: "No tickets found in this category"

## Getting Help

If you still see no tickets after trying these steps:

1. Open browser console (F12)
2. Navigate to admin page
3. Copy all console output related to "Fetching tickets"
4. Check the error message that appears

Common error patterns:
- **`PGRST116`**: User record not found → Create user in tbl_users
- **`permission denied`**: RLS policy issue → Run Step 4 verification
- **No error, just empty**: No tickets exist → Run Step 3 verification

