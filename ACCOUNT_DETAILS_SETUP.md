# Account Details Feature - Quick Setup

## 🚀 Quick Start (5 minutes)

### Step 1: Update Database (2 minutes)

1. Go to your **Supabase Dashboard**
2. Click **SQL Editor** in the left sidebar
3. Click **"+ New query"**
4. Copy and paste the contents of `account-details-migration.sql`
5. Click **"Run"** button
6. Wait for success message ✅

**What this does:**
- Adds 5 new columns to `tbl_users` table:
  - `phone` - VARCHAR(20)
  - `job_title` - VARCHAR(255)
  - `company` - VARCHAR(255)
  - `bio` - TEXT
  - `avatar_url` - VARCHAR(500)

### Step 2: Test Locally (3 minutes)

```bash
# Start development server
npm run dev

# Navigate to http://localhost:3000
# Log in to your account
# Click Menu (☰) in top-right
# Click "Account Details"
# Try editing and saving your profile
```

### Step 3: Deploy (Optional)

```bash
# Commit changes
git add .
git commit -m "Add Account Details feature with editable profile"

# Push to Vercel (if using)
git push origin main
```

---

## 📋 What Was Added

| File | Type | Purpose |
|------|------|---------|
| `components/AccountDetailsModal.tsx` | NEW | Modal component for profile editing |
| `components/Header.tsx` | UPDATED | Added Account Details button |
| `lib/types.ts` | UPDATED | Extended User interface |
| `account-details-migration.sql` | NEW | Database schema migration |
| `ACCOUNT_DETAILS_FEATURE.md` | NEW | Full documentation |

---

## ✨ Features

✅ View user email (read-only)
✅ View user role with badge color
✅ View joining date (human-readable format)
✅ Edit full name
✅ Edit phone number
✅ Edit job title
✅ Edit company
✅ Edit bio
✅ Real-time validation
✅ Success/error notifications
✅ Saves to Supabase database
✅ Mobile responsive
✅ Dark theme

---

## 🧪 Testing

After setup, verify:

- [ ] Click Menu → Account Details opens modal
- [ ] Your email shows as read-only
- [ ] Your role displays with correct badge
- [ ] Joining date shows in human format
- [ ] Can edit Full Name field
- [ ] Can edit Phone field
- [ ] Can edit Job Title field
- [ ] Can edit Company field
- [ ] Can edit Bio field
- [ ] Click "Save Changes" works
- [ ] Success message appears
- [ ] Close modal and reopen - data is saved
- [ ] Works on mobile

---

## 🔍 Database Verification

To verify the migration was successful:

1. Go to Supabase Dashboard
2. Click **Table Editor** (left sidebar)
3. Click **tbl_users** table
4. Scroll right to see new columns:
   - `phone`
   - `job_title`
   - `company`
   - `bio`
   - `avatar_url`

---

## 🐛 Troubleshooting

**Q: Modal doesn't open**
- Clear browser cache (Cmd+Shift+R on Mac)
- Check browser console for errors
- Ensure Header component imported properly

**Q: Can't save changes**
- Check browser DevTools Network tab
- Verify Supabase connection working
- Ensure logged in with valid session

**Q: Fields show as empty**
- Database migration might not have run
- Check Supabase SQL Editor for errors
- Verify `tbl_users` table has new columns

**Q: Joining date shows wrong format**
- `date-fns` might not be installed
- Run `npm install date-fns` if needed
- Already included in package.json

---

## 📞 Support

For more details, see:
- `ACCOUNT_DETAILS_FEATURE.md` - Full feature documentation
- `PROJECT_CONTEXT.md` - Project overview
- Supabase Docs - https://supabase.com/docs

---

## 🎉 Done!

Your users can now manage their account profiles! 

**Next Steps:**
- Deploy to production
- Inform users about the new feature
- Gather feedback for improvements
