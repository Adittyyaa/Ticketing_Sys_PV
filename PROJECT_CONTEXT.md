# Ticketing System - Project Context & Chat History

## Project Overview
A Next.js ticketing system with Supabase backend, deployed on Vercel. The system supports user and admin roles with ticket management capabilities.

**Tech Stack:**
- Frontend: Next.js 14+ with TypeScript and React
- Backend: Supabase (PostgreSQL + Auth)
- Deployment: Vercel
- Authentication: Google OAuth + Email
- Styling: Tailwind CSS
- Database: Supabase PostgreSQL with Row Level Security (RLS)

---

## Key Project Structure

```
/app
  /admin - Admin dashboard pages
  /api - API routes for admin operations
  /auth - Authentication pages (login, signup, callback)
  /tickets - Ticket management pages
  /debug - Debug pages
/components - React components
  - AnalyticsDashboard.tsx
  - AttachmentsSection.tsx
  - CommentsSection.tsx
  - ExportButton.tsx
  - FilterBar.tsx
  - Header.tsx
  - PDFHeader.tsx
  - TicketTable.tsx
/lib
  - supabase.ts - Supabase client configuration
  - store.ts - State management
  - types.ts - TypeScript types
```

---

## Database Schema

### Tables
1. **tbl_users** - User profile and role management
   - id (UUID, PK, references auth.users)
   - email (VARCHAR)
   - full_name (VARCHAR)
   - role (VARCHAR: 'user' or 'admin')
   - created_at, updated_at (TIMESTAMP)

2. **tbl_tickets** - Ticket records
   - id (UUID, PK)
   - number (BIGSERIAL, UNIQUE)
   - user_id (UUID, FK to auth.users)
   - title, description (TEXT)
   - category (VARCHAR)
   - priority (LOW, MEDIUM, HIGH, URGENT)
   - status (UNTOUCHED, PENDING, OPENED, SOLVED)
   - tags (TEXT[])
   - assigned_to (UUID)
   - created_at, updated_at (TIMESTAMP)

### Row Level Security (RLS)
- Users can only view their own tickets
- Admins can view all tickets
- Users can create/update/delete only their own tickets
- Admins can manage all tickets

---

## Environment Configuration

### .env.local
```
NEXT_PUBLIC_SUPABASE_URL=https://kqnuxtumkvhvkedaobcr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Supabase URL Configuration Required
**Authentication → URL Configuration:**
- Site URL: `https://ticketing-sys-pv-git-main-aditya-sharmas-projects-e9496eb2.vercel.app`
- Redirect URLs: `https://ticketing-sys-pv-git-main-aditya-sharmas-projects-e9496eb2.vercel.app/auth/callback`

---

## Chat Session 1: OAuth & Deployment Issues

### Problem
After deploying to Vercel, OAuth login showed errors:
- "Invalid origin: Cannot contain a wildcard (*)"
- "Invalid origin: URIs must not contain a path or end with '/'"

**Root Cause:** Incorrect Google Cloud OAuth configuration

### Solution Applied
1. **Google Cloud OAuth Setup**
   - Authorized JavaScript origins: `https://ticketing-sys-pv-git-main-aditya-sharmas-projects-e9496eb2.vercel.app` (no path, no wildcard)
   - Authorized redirect URIs: `https://ticketing-sys-pv-git-main-aditya-sharmas-projects-e9496eb2.vercel.app/auth/callback` (full path allowed here)

2. **Supabase Configuration Fix**
   - Updated `lib/supabase.ts` with proper auth configuration:
     ```typescript
     auth: {
       flowType: 'pkce',
       autoRefreshToken: true,
       persistSession: true,
       detectSessionInUrl: true,
     }
     ```
   - Added `detectSessionInUrl: true` to handle URL fragment tokens from OAuth redirects
   - Enabled PKCE flow for security

3. **Supabase URL Configuration**
   - Set Site URL to Vercel domain
   - Added redirect URL for callback page
   - This ensures Supabase knows where to redirect after authentication

### OAuth Flow
1. User clicks Google icon
2. Redirected to Google login
3. Google redirects to Supabase with auth code
4. Supabase generates JWT token and redirects to `#access_token=...`
5. App detects token in URL and processes authentication
6. User is redirected based on role (admin → `/admin`, user → `/tickets`)

### Current Status
- ✅ Supabase configured and connected
- ✅ Google OAuth set up
- ✅ Vercel deployment URL configured
- 🔄 Testing OAuth flow with Vercel domain

---

## Chat Session 2: Account Details Feature

### Feature Request
Add an Account Details modal accessible from the header that shows:
- User email (read-only)
- User role (read-only) 
- Joining date (read-only)
- Editable fields: name, phone, email, job title, company, bio

### Implementation Completed

**Files Created:**
1. `components/AccountDetailsModal.tsx` - Modal component for account profile
2. `account-details-migration.sql` - Database migration to add profile fields
3. `ACCOUNT_DETAILS_FEATURE.md` - Complete feature documentation

**Files Updated:**
1. `components/Header.tsx` - Added Account Details button and modal integration
2. `lib/types.ts` - Extended User interface with new fields (phone, job_title, company, bio)

**Database Changes:**
- Added columns to `tbl_users`: phone, job_title, company, bio, avatar_url
- Existing RLS policies already support user self-updates
- No additional permissions needed

**Features:**
- Click Menu → Account Details from any page
- View read-only info: email, role, joining date (relative + absolute)
- Edit profile: full name, phone, job title, company, bio
- Real-time form updates
- Save to Supabase with success/error notifications
- Loading states and smooth UX
- Responsive design (mobile-friendly)
- Dark theme consistent with app

**Key UX Details:**
- Read-only fields shown in separate section
- Joining date shows both relative ("2 days ago") and absolute ("6/4/2026") format
- Role shown with color badge (purple for admin, blue for user)
- Form validation and error handling
- Success message auto-dismisses after 3 seconds
- Modal scrollable on small screens
- All changes immediately saved to database

### Status
✅ Feature complete and tested
✅ Build verification passed (0 errors)
✅ Ready for deployment

---

## Key Supabase Client Configuration

**File:** `lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
```

**Configuration Explained:**
- `flowType: 'pkce'` - Proof Key for Code Exchange (OAuth 2.0 security standard)
- `autoRefreshToken: true` - Automatically refresh tokens before expiry
- `persistSession: true` - Keep session in browser storage
- `detectSessionInUrl: true` - Auto-detect auth tokens in URL fragments

---

## Authentication Flow

### Login Endpoints
- `/auth` - Main auth page with role selection
- `/auth/login` - General login redirect
- `/auth/login/user` - User login page
- `/auth/login/admin` - Admin login page
- `/auth/callback` - OAuth callback handler (processes tokens)
- `/auth/signup` - User registration

### Callback Handler Logic
**File:** `app/auth/callback/page.tsx`

1. Extracts session from Supabase
2. Fetches user role from `tbl_users` table
3. Redirects based on role:
   - Admin → `/admin`
   - User → `/tickets`
4. Error handling: defaults to `/tickets` or redirects to `/auth` on failure

---

## Deployment Checklist

### Before Deployment
- [ ] Supabase database created and tables set up
- [ ] Environment variables added to `.env.local`
- [ ] Google OAuth credentials obtained
- [ ] RLS policies configured in Supabase

### Vercel Deployment
- [ ] Repository connected to Vercel
- [ ] Environment variables added in Vercel project settings
- [ ] Build command: `npm run build` (default)
- [ ] Start command: `npm start` (default)

### Post-Deployment Configuration
- [ ] Google Cloud OAuth settings updated with Vercel domain
- [ ] Supabase URL Configuration updated with Vercel domain
- [ ] Test OAuth flow from production URL
- [ ] Verify RLS policies working correctly

---

## Common Issues & Solutions

### Issue 1: OAuth Redirect Loop
**Symptom:** Stuck on `/auth` page after Google login
**Solution:** 
- Check Supabase URL Configuration has correct redirect URLs
- Verify Google OAuth has correct authorized origins and redirect URIs
- Ensure `detectSessionInUrl: true` in Supabase client config

### Issue 2: "User role not found"
**Symptom:** Error after OAuth login, user not redirected
**Solution:**
- Verify user record exists in `tbl_users` table
- Check RLS policy allows reading user role
- Admin API route should create user record on first login

### Issue 3: Localhost vs Production URLs
**Symptom:** Works on localhost but fails on Vercel
**Solution:**
- Add both localhost and Vercel URLs to Supabase URL Configuration
- Configure separate OAuth apps for development/production
- Use environment-specific configuration in code

### Issue 4: CORS Errors
**Symptom:** Browser blocks requests from frontend
**Solution:**
- Supabase handles CORS automatically
- Ensure requests use correct API endpoints
- Check browser console for specific CORS errors

---

## Features Implemented

### User Features
- ✅ Email/Password authentication
- ✅ Google OAuth login
- ✅ Create tickets with title, description, category, priority
- ✅ View own tickets with filtering and search
- ✅ Update ticket status
- ✅ Add comments to tickets
- ✅ Attach files to tickets
- ✅ Export tickets (PDF, CSV)
- ✅ Dashboard with ticket analytics
- ✅ Account Details - View and edit profile (NEW)

### Admin Features
- ✅ View all user tickets
- ✅ Manage ticket status and assignment
- ✅ User management panel
- ✅ Analytics dashboard
- ✅ Create admin users
- ✅ View ticket comments and attachments

### Technical Features
- ✅ Row Level Security (RLS) for data isolation
- ✅ Real-time updates with Supabase subscriptions
- ✅ PDF export with headers
- ✅ File attachments
- ✅ Comment system
- ✅ Advanced filtering and sorting
- ✅ Responsive design with Tailwind CSS

---

## Next Steps & Recommendations

1. **Testing**
   - Test OAuth flow on production URL
   - Test all CRUD operations with RLS
   - Test admin vs user access levels

2. **Monitoring**
   - Set up error logging (Sentry, LogRocket)
   - Monitor Supabase usage and performance
   - Set up alerts for failed authentications

3. **Security**
   - Audit RLS policies
   - Implement rate limiting on API routes
   - Add input validation and sanitization
   - Regular security audits

4. **Performance**
   - Optimize database indexes
   - Implement query caching
   - Monitor Core Web Vitals on Vercel

5. **Future Features**
   - Email notifications
   - Ticket assignment to admin users
   - Advanced analytics and reports
   - Ticket templates
   - Priority queue management

---

## Useful Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# TypeScript check
npm run type-check

# Lint code
npm run lint
```

---

## References & Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Vercel Documentation](https://vercel.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

**Last Updated:** June 4, 2026
**Project Status:** Active Development / Production Deployment
