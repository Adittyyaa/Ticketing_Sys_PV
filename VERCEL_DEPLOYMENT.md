# Vercel Deployment Guide

## Prerequisites
- GitHub repository with your code (✅ Done)
- Vercel account (create at https://vercel.com)
- Supabase project set up

## Environment Variables Needed

Before deploying, you need these environment variables from your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/new
   - Sign in with your GitHub account

2. **Import Your Repository**
   - Click "Add New..." → "Project"
   - Select your GitHub repository: `Adittyyaa/Ticketing_Sys_PV`
   - Click "Import"

3. **Configure Project**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

4. **Add Environment Variables**
   - Click "Environment Variables"
   - Add these variables:
     - `NEXT_PUBLIC_SUPABASE_URL` = (from your Supabase project)
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (from your Supabase project)

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete

6. **Update Supabase OAuth Redirect URLs**
   - Go to your Supabase Dashboard
   - Navigate to Authentication → URL Configuration
   - Add your Vercel URL to "Redirect URLs":
     - `https://your-app.vercel.app/auth/callback`
   - Add to "Site URL" as well

### Option 2: Deploy via CLI

```bash
# Login to Vercel
vercel login

# Deploy (this command will be run automatically)
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? ticketing-sys-pv (or your choice)
# - Directory? ./
# - Override settings? No

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

## Post-Deployment

### 1. Update OAuth Callback URLs in Supabase
```
https://your-app.vercel.app/auth/callback
```

### 2. Update Site URL in Supabase
```
https://your-app.vercel.app
```

### 3. Test Your Deployment
- Visit your Vercel URL
- Try logging in with Google OAuth
- Try email/password login
- Create a test ticket
- Test admin functionality

## Troubleshooting

### Build Errors
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly

### OAuth Not Working
- Verify callback URLs in Supabase match Vercel URL
- Check that environment variables are set in Vercel
- Clear browser cache and try again

### 404 Errors on Routes
- Next.js should handle this automatically
- Verify `vercel.json` is configured correctly
- Check that all files are committed to GitHub

## Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Update Supabase OAuth URLs with new domain

## Automatic Deployments

Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: When you create a pull request

Every push to GitHub triggers a new deployment!

## Useful Commands

```bash
# Check deployment status
vercel ls

# View project info
vercel inspect

# View logs
vercel logs

# Remove project
vercel remove
```

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Supabase Auth: https://supabase.com/docs/guides/auth
