# Admin System - Complete Setup Guide

## Overview
A complete admin management system with separate admin accounts, bulk ticket operations, and admin-specific dashboard. Admins have elevated privileges to manage users, tickets, and create other admin accounts.

---

## Features Implemented ✅

### 1. **Admin Account Creation**
- Create admin accounts with email/password
- Auto-confirm email for admin accounts
- Only existing admins can create new admins
- Separate admin login page at `/auth/login/admin`

### 2. **Admin Management Dashboard**
- Dedicated page at `/admin/manage-admins`
- View all current administrators
- Create new admin accounts
- Revoke admin privileges (converts to regular user)
- Statistics: Total admins, regular users, total users
- Security: Cannot delete your own admin account

### 3. **Bulk Ticket Operations**
- Select individual tickets or select all
- Bulk delete multiple tickets at once
- Admin-only feature (users don't see checkboxes)
- Confirmation before deletion
- Success/error notifications

### 4. **Enhanced Admin Dashboard**
- Separate tabs: "My Tickets" and "Other Tickets"
- View all tickets from all users
- Analytics dashboard with ticket statistics
- Export functionality
- Link to admin management and user management

### 5. **Role-Based Access Control**
- Admin role displayed with purple badge and crown icon
- User role displayed with blue badge
- Different dashboards for admins vs users
- Admins redirected to `/admin`, users to `/tickets`

---

## File Structure

```
New Files Created:
├── app/api/admin/create-admin/route.ts          # API: Create admin accounts
├── app/api/admin/bulk-delete-tickets/route.ts   # API: Bulk delete tickets
└── app/admin/manage-admins/page.tsx             # UI: Admin management page

Updated Files:
├── app/admin/page.tsx                            # Enhanced with bulk ops
├── components/TicketTable.tsx                    # Added bulk selection
└── app/admin/users/page.tsx                      # Existing user management
```

---

## Step-by-Step Setup

### Step 1: Create Your First Admin Account

Since you need an admin to create admins, you'll need to manually create the first one in Supabase:

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" → "Create new user"
3. Fill in:
   - Email: `admin@pvadvisory.com`
   - Password: `your-secure-password`
   - Auto Confirm User: ✅ **Checked**
4. Click "Create User"
5. Copy the user's UUID
6. Go to SQL Editor and run:

```sql
-- Insert admin user profile
INSERT INTO public.tbl_users (id, email, full_name, role, created_at)
VALUES (
  'paste-user-uuid-here',
  'admin@pvadvisory.com',
  'Admin User',
  'admin',
  NOW()
);
```

**Option B: Via SQL Only**

```sql
-- This requires service role key and cannot be done from SQL Editor
-- Use Supabase CLI or service role API instead
```

### Step 2: Test Admin Login

1. Go to `/auth/login/admin`
2. Login with your admin credentials
3. You should be redirected to `/admin` (admin dashboard)
4. Verify you see:
   - "ADMIN DASHBOARD" banner at top
   - "My Tickets" and "Other Tickets" tabs
   - "Manage Admins" button
   - Analytics dashboard
   - Checkboxes on tickets (for bulk delete)

### Step 3: Create Additional Admins

1. Click "Manage Admins" button in admin dashboard
2. Click "Create Admin Account" button
3. Fill in the form:
   - Full Name: New admin's name
   - Email: Their email address
   - Password: Secure password (min 6 chars)
4. Click "Create Admin Account"
5. The new admin will appear in the administrators table
6. They can now login at `/auth/login/admin`

### Step 4: Test Bulk Delete

1. Go to admin dashboard
2. Check the "Select All" checkbox or select individual tickets
3. Click "Delete Selected" button
4. Confirm deletion
5. Tickets should be deleted and table refreshes

---

## API Endpoints

### 1. Create Admin Account
```
POST /api/admin/create-admin
Authorization: Bearer {access_token}

Request Body:
{
  "email": "newadmin@pvadvisory.com",
  "password": "securepassword123",
  "fullName": "John Doe"
}

Response:
{
  "success": true,
  "userId": "uuid",
  "message": "Admin account created successfully"
}

Errors:
- 401: Unauthorized (no token or invalid token)
- 403: Forbidden (requester is not an admin)
- 400: Bad request (missing fields or creation failed)
```

### 2. Bulk Delete Tickets
```
POST /api/admin/bulk-delete-tickets
Authorization: Bearer {access_token}

Request Body:
{
  "ticketIds": ["uuid1", "uuid2", "uuid3"]
}

Response:
{
  "success": true,
  "deletedCount": 3,
  "message": "Successfully deleted 3 ticket(s)"
}

Errors:
- 401: Unauthorized (no token or invalid token)
- 403: Forbidden (requester is not an admin)
- 400: Bad request (empty array or deletion failed)
```

---

## User Roles Comparison

| Feature | Admin | Regular User |
|---------|-------|--------------|
| View own tickets | ✅ | ✅ |
| View all tickets | ✅ | ❌ |
| Create tickets | ✅ | ✅ |
| Edit own tickets | ✅ | ✅ |
| Delete own tickets | ✅ | ✅ |
| Bulk delete tickets | ✅ | ❌ |
| Create users | ✅ | ❌ |
| Create admins | ✅ | ❌ |
| View admin dashboard | ✅ | ❌ |
| Access admin management | ✅ | ❌ |
| Revoke admin privileges | ✅ | ❌ |

---

## Security Features

### 1. **Authorization Checks**
- All admin APIs verify JWT token
- Check requester's role in database
- Only admins can access admin endpoints
- Service role key used for privileged operations

### 2. **Self-Protection**
- Cannot delete your own admin account
- "Current User" indicator on your admin row
- Delete button disabled for your account

### 3. **Confirmation Dialogs**
- Bulk delete requires confirmation
- Revoke admin requires confirmation
- Shows count of affected items

### 4. **Auto-Confirmation**
- Admin accounts are auto-confirmed (no email verification needed)
- Regular users follow normal email verification flow

### 5. **Password Requirements**
- Minimum 6 characters
- Enforced by Supabase Auth

---

## Database Schema

### tbl_users Table
```sql
CREATE TABLE tbl_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user', -- 'user' or 'admin'
  phone VARCHAR(20),
  job_title VARCHAR(100),
  company VARCHAR(100),
  bio TEXT,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS)
Current policies allow:
- Users can read/update their own records
- Admins can read all records (via `get_user_role()` function)
- Service role bypasses RLS for admin operations

---

## Admin Dashboard Features

### Analytics Cards
- **Total Tickets**: Count of all tickets in system
- **By Status**: Untouched, Pending, Opened, Solved
- **By Priority**: Low, Medium, High, Urgent
- **Unique Users**: Number of users who created tickets
- **Avg Resolution Time**: Average time to solve tickets

### Ticket Tabs
- **My Tickets**: Tickets created by the logged-in admin
- **Other Tickets**: Tickets created by other users/admins

### Actions Available
- **Export**: Export tickets to PDF/CSV
- **Manage Admins**: Navigate to admin management page
- **Add User**: Navigate to user creation page
- **Bulk Delete**: Select and delete multiple tickets

---

## UI/UX Features

### Design Elements
- **Glass Morphism**: Frosted glass effect on cards and modals
- **Color Coding**: 
  - Purple: Admin-related features
  - Blue: General features
  - Red: Destructive actions
  - Green: Success states
- **Icons**: Lucide React icons throughout
- **Badges**: Role badges with colors and icons
  - Admin: Purple with crown icon
  - User: Blue with user icon

### Animations
- Fade-in animations for modals and messages
- Smooth transitions on hover
- Loading states with spinners
- Auto-dismiss success messages (5 seconds)

### Responsive Design
- Mobile-friendly tables with horizontal scroll
- Adaptive grid layouts
- Touch-friendly buttons and checkboxes
- Readable on all screen sizes

---

## Testing Checklist

### Admin Account Creation
- [ ] Can login with first admin account
- [ ] Redirected to `/admin` after login
- [ ] See "ADMIN DASHBOARD" banner
- [ ] Can access "Manage Admins" page
- [ ] Can create new admin account
- [ ] New admin receives credentials
- [ ] New admin can login successfully

### Admin Management
- [ ] See all current admins in table
- [ ] See statistics (total admins, users)
- [ ] Can create admin with form
- [ ] Form validates required fields
- [ ] Success message appears after creation
- [ ] Cannot delete own admin account
- [ ] Can revoke other admin's privileges
- [ ] Confirmation dialog appears before revoke

### Bulk Delete
- [ ] Checkboxes visible only to admins
- [ ] Can select individual tickets
- [ ] Can select all tickets
- [ ] Bulk actions bar appears when tickets selected
- [ ] Shows count of selected tickets
- [ ] Confirmation dialog before delete
- [ ] Success message after delete
- [ ] Table refreshes after delete

### Role Display
- [ ] Admin badge shows in header dropdown
- [ ] Admin badge shows in user table
- [ ] Admin badge shows in admin management
- [ ] Role shows in account details modal
- [ ] Correct color coding (purple for admin)

### Security
- [ ] Regular users cannot access `/admin`
- [ ] Regular users cannot access `/admin/manage-admins`
- [ ] Regular users don't see bulk delete checkboxes
- [ ] API returns 403 for non-admin requests
- [ ] Cannot create admin without being admin

---

## Troubleshooting

### Issue: "Only admins can create admin accounts" error
**Solution**: 
1. Check your user's role in `tbl_users` table
2. Verify you're logged in with an admin account
3. Check browser console for authentication errors
4. Ensure session token is valid (try logging out and in)

### Issue: Bulk delete button doesn't appear
**Solution**:
1. Verify you're logged in as admin
2. Check `isAdmin` state in React DevTools
3. Select at least one ticket
4. Refresh the page to reload permissions

### Issue: Cannot login to admin page
**Solution**:
1. Verify account exists in Supabase Auth
2. Check `tbl_users` table has matching record with role='admin'
3. Try password reset if forgotten
4. Check Supabase logs for auth errors

### Issue: Admin sees regular user dashboard
**Solution**:
1. Check callback handler logic in `/auth/callback`
2. Verify role is correctly set in database
3. Clear browser cache and cookies
4. Logout and login again

---

## Environment Variables Required

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Required for admin operations
```

**⚠️ Important**: Never commit `.env.local` to version control!

---

## Next Steps & Enhancements

### Possible Future Features
- [ ] Admin activity logs (track who created/deleted what)
- [ ] Admin permissions levels (super admin, moderator, etc.)
- [ ] Bulk edit tickets (status, priority, assignment)
- [ ] Admin notifications system
- [ ] Two-factor authentication for admins
- [ ] Admin session management (view/revoke active sessions)
- [ ] Audit trail for all admin actions
- [ ] Export admin activity reports
- [ ] Email notifications when admins are created/removed
- [ ] Admin dashboard customization
- [ ] Ticket assignment to specific admins
- [ ] Admin workload distribution metrics

---

## Best Practices

### For Admins
1. ✅ Use strong, unique passwords
2. ✅ Enable 2FA when available
3. ✅ Don't share admin credentials
4. ✅ Review admin list regularly
5. ✅ Remove inactive admins promptly
6. ✅ Use descriptive full names
7. ✅ Log out from shared devices
8. ✅ Report suspicious activity

### For Developers
1. ✅ Always use service role key for admin operations
2. ✅ Verify authorization on every admin endpoint
3. ✅ Use transactions for operations that modify multiple tables
4. ✅ Log all admin actions for audit trail
5. ✅ Never expose service role key in frontend code
6. ✅ Implement rate limiting on admin creation endpoints
7. ✅ Add CAPTCHA for sensitive admin operations
8. ✅ Regular security audits of admin features

---

## Quick Reference Commands

```bash
# Build and check for errors
npm run build

# Start development server
npm run dev

# Check TypeScript errors
npx tsc --noEmit

# View Supabase logs
npx supabase logs

# Create database backup
# (Use Supabase Dashboard → Database → Backups)
```

---

## Support & Documentation

- **Next.js**: https://nextjs.org/docs
- **Supabase Auth**: https://supabase.com/docs/guides/auth
- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security
- **TypeScript**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

---

**Last Updated**: June 4, 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

