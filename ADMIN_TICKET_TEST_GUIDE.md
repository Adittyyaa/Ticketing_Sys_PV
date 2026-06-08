# Admin Ticket Viewing - Quick Test Guide

## What Was Fixed
Admins can now see all tickets (both their own and others') on the admin dashboard at `/admin`.

## Quick Start (2 Minutes)

### Setup (Do This Once)

1. **Go to Supabase Dashboard** → Authentication → Users
   - Note the UUID of your admin user

2. **Run in Supabase SQL Editor**:
   ```sql
   -- Make sure user is admin
   UPDATE public.tbl_users 
   SET role = 'admin' 
   WHERE id = 'PASTE-YOUR-ADMIN-UUID-HERE';
   
   -- Verify it worked
   SELECT id, email, role FROM public.tbl_users WHERE role = 'admin';
   ```

### Test the Fix

1. **Create Test Tickets**
   - Go to `/tickets/new` as a regular user and create a test ticket
   - Create another test ticket from a different user
   - Or just use existing tickets

2. **Test Admin Access**
   - Log out and log in as admin
   - Go to `/admin`
   - You should see:
     - "My Tickets" tab (shows tickets you created as admin)
     - "Other Tickets" tab (shows tickets from other users)
     - Both tabs should have counts > 0 if tickets exist

3. **Check Console Logs** (F12)
   - Look for: `Fetching tickets for admin user: [UUID]`
   - Look for: `Total tickets fetched: [number]`
   - Should show successful fetch

## What to Expect

### Before Fix
- Admin dashboard shows empty tabs
- No error messages
- Silent failure in console

### After Fix
- Admin dashboard shows all tickets separated by creator
- Clear loading indicator while fetching
- Error messages if something goes wrong
- Detailed console logs for troubleshooting

## Common Scenarios to Test

### Scenario 1: Admin with No Tickets
**Steps**:
1. Create admin if needed
2. Admin has never created a ticket
3. Go to `/admin`

**Expected Result**:
- "My Tickets" shows 0
- "Other Tickets" shows all other users' tickets

### Scenario 2: Admin with Own Tickets
**Steps**:
1. Admin creates a ticket (log in as admin, go to `/tickets/new`)
2. Go to `/admin`

**Expected Result**:
- "My Tickets" shows the ticket admin created
- "Other Tickets" shows tickets from other users

### Scenario 3: Admin with Bulk Operations
**Steps**:
1. Go to `/admin` → "Other Tickets"
2. Select multiple tickets using checkboxes
3. Click "Delete Selected"

**Expected Result**:
- Selected tickets are deleted
- Tab updates automatically
- Success message appears

### Scenario 4: Export Tickets
**Steps**:
1. Go to `/admin`
2. Click "Export Tickets" button in either tab

**Expected Result**:
- CSV file downloads
- Contains ticket data from current tab

## Troubleshooting

### Issue: Page Redirects to `/tickets`
**Cause**: User is not an admin
**Fix**: 
```sql
UPDATE public.tbl_users 
SET role = 'admin' 
WHERE id = 'YOUR-UUID';
```

### Issue: No Tickets Show Even When They Exist
**Cause**: Tickets might not exist or RLS issue
**Debug**:
1. Open console (F12)
2. Look for error message
3. Check: `SELECT COUNT(*) FROM public.tbl_tickets;`
4. Create test ticket as regular user

### Issue: Error Message on Page
**Fix**: Read error message, open console, check logs
- Most common: Missing user profile (auto-fixed now)
- Check logs for detailed error

### Issue: Page Hangs on "Loading tickets..."
**Cause**: Network issue or query problem
**Fix**:
1. Wait 5 seconds
2. Reload page
3. Check browser network tab
4. Verify Supabase URL in `.env.local`

## Advanced Testing

### Test RLS Policy
Run in Supabase SQL Editor as admin user:
```sql
-- Should return all tickets
SELECT COUNT(*) FROM public.tbl_tickets;

-- Should return tickets created by admin user
SELECT COUNT(*) FROM public.tbl_tickets WHERE user_id = auth.uid();

-- Should return tickets by other users
SELECT COUNT(*) FROM public.tbl_tickets WHERE user_id != auth.uid();
```

### Test Ticket Counts
```sql
-- Total tickets in system
SELECT COUNT(*) as total FROM public.tbl_tickets;

-- Count by status
SELECT status, COUNT(*) as count FROM public.tbl_tickets GROUP BY status;

-- Count by priority
SELECT priority, COUNT(*) as count FROM public.tbl_tickets GROUP BY priority;
```

### Test User Profiles
```sql
-- Check all admin users
SELECT id, email, role FROM public.tbl_users WHERE role = 'admin';

-- Check all users
SELECT COUNT(*) as total_users FROM public.tbl_users;

-- Check specific user
SELECT * FROM public.tbl_users WHERE id = 'YOUR-UUID';
```

## Real-World Test Flow

**Complete workflow to verify everything works**:

1. **Create Multiple Users**
   - Create 3 regular users (via admin portal or manually)
   - Create 1 admin user

2. **Create Tickets**
   - User 1 creates 2 tickets
   - User 2 creates 3 tickets
   - Admin creates 1 ticket
   - User 3 creates 2 tickets

3. **Test Admin View**
   - Admin logs in
   - Views `/admin` dashboard
   - Should see:
     - "My Tickets": 1 (admin's own)
     - "Other Tickets": 7 (from User 1, 2, 3)

4. **Test Bulk Delete**
   - Select 3 tickets from "Other Tickets"
   - Click delete
   - Verify they're deleted
   - Verify counts update

5. **Test Export**
   - Export "My Tickets" (1 ticket)
   - Export "Other Tickets" (4 tickets)
   - Verify CSV files contain correct data

6. **Test Analytics**
   - Dashboard shows correct counts
   - Total tickets: 5 (7 deleted - 3 + 1 admin = 5)
   - Status breakdown accurate
   - Priority breakdown accurate

## Performance Test

Admin dashboard should load tickets in:
- < 1 second with < 100 tickets
- < 2 seconds with < 1000 tickets
- < 5 seconds with < 10000 tickets

If slower:
- Check database indexes on `tbl_tickets`
- Check Supabase network latency
- Verify Supabase region matches your location

## Browser DevTools Tips

### View Network Requests
1. F12 → Network tab
2. Refresh admin page
3. Look for request to `tbl_tickets`
4. Check response for data
5. Check headers for authentication

### View Console Logs
1. F12 → Console tab
2. Filter for "Fetching tickets"
3. Look for error messages
4. Check for warnings

### Monitor Performance
1. F12 → Performance tab
2. Record loading of admin page
3. Check for long tasks
4. Identify bottlenecks

## Success Indicators

✅ Admin logs in without "user not confirmed" error
✅ Admin page loads and displays tickets
✅ "My Tickets" tab shows correct count
✅ "Other Tickets" tab shows correct count
✅ Can select and delete tickets
✅ Can export tickets to CSV
✅ Console shows successful fetch logs
✅ Analytics dashboard updates correctly

## Next Steps

If all tests pass:
- System is working correctly
- Admin can manage all tickets
- RLS policies are functioning
- Data is secure

If tests fail:
- Check error messages on page
- Review browser console logs
- Run SQL diagnostics from guide
- Check ADMIN_TICKET_VIEW_FIX.md for detailed help

