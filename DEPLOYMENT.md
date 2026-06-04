# Deployment to Vercel

## 1. Prepare Your Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: ticketing system"
```

## 2. Push to GitHub

1. Create a new repository on [github.com](https://github.com/new)
2. Push your code:

```bash
git remote add origin https://github.com/YOUR_USERNAME/ticketing-system.git
git branch -M main
git push -u origin main
```

## 3. Deploy to Vercel

### Option A: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option B: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Select your repository
5. Click "Import"

## 4. Configure Environment Variables

In Vercel dashboard:

1. Go to your project settings
2. Click **Environment Variables**
3. Add these variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key

## 5. Deploy

After adding environment variables, Vercel will automatically redeploy. Your app will be live at `https://YOUR_PROJECT.vercel.app`

## Custom Domain (Optional)

1. In Vercel project settings, go to **Domains**
2. Add your custom domain
3. Update your domain registrar's DNS records with Vercel's nameservers

## Auto-Deploy

Every push to `main` branch will automatically deploy to Vercel.
