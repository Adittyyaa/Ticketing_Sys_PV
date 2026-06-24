# 🚀 Vercel Deployment Guide - PostgreSQL Ticketing System

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **PostgreSQL Database**: You'll need a hosted PostgreSQL instance

## 🗄️ Database Setup Options

### Option 1: Vercel Postgres (Recommended)
Vercel provides managed PostgreSQL databases that integrate seamlessly.

### Option 2: External PostgreSQL Providers
- **Neon** (recommended for free tier): https://neon.tech
- **Supabase** (just the database): https://supabase.com
- **Railway**: https://railway.app
- **PlanetScale** (MySQL alternative)
- **AWS RDS**, **Google Cloud SQL**, **Azure Database**

## 🚀 Step-by-Step Deployment

### 1. Create PostgreSQL Database

#### Using Neon (Recommended Free Option):

1. Go to [neon.tech](https://neon.tech)
2. Sign up and create a new project
3. Copy the connection string (looks like):
   ```
   postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

#### Using Vercel Postgres:

1. In your Vercel dashboard, go to "Storage"
2. Create a new Postgres database
3. Note the connection details

### 2. Deploy to Vercel

#### Method A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
vercel

# Follow the prompts:
# - Set up and deploy? [Y]
# - Which scope? [Your account]
# - Link to existing project? [N]
# - What's your project's name? [ticketing-system]
# - In which directory is your code located? [./]
```

#### Method B: GitHub Integration

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Choose "Next.js" framework (auto-detected)
5. Click "Deploy"

### 3. Configure Environment Variables

In your Vercel project dashboard, go to **Settings** → **Environment Variables** and add:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-here-32-chars-minimum

# API Key for incoming tickets (generate with: openssl rand -hex 32)
TICKETING_API_KEY=your-secure-api-key-for-incoming-tickets

# App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app

# Optional: Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload Limits
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf,text/plain
```

### 4. Initialize Database Schema

After deployment, you need to set up your database tables:

#### Method A: Using Database Client

1. Connect to your PostgreSQL database using a client like:
   - **pgAdmin**: https://www.pgadmin.org/
   - **TablePlus**: https://tableplus.com/
   - **DBeaver**: https://dbeaver.io/

2. Run the setup script:
   ```sql
   -- Copy and paste the contents of database-setup-postgresql.sql
   ```

#### Method B: Using Vercel Functions

Create a setup API endpoint (temporary):

```typescript
// app/api/setup-database/route.ts (create this file temporarily)
import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { pool } from '@/lib/database'

export async function POST() {
  try {
    const sqlFile = await readFile(
      join(process.cwd(), 'database-setup-postgresql.sql'),
      'utf8'
    )
    
    await pool.query(sqlFile)
    return NextResponse.json({ success: true, message: 'Database setup complete' })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

Then call: `POST https://your-app.vercel.app/api/setup-database`

**⚠️ IMPORTANT**: Delete this endpoint after setup for security!

### 5. Test Your Deployment

1. Visit your Vercel app URL
2. Test user registration/login
3. Create a test ticket
4. Verify database connectivity

## 🔧 Production Optimizations

### 1. Connection Pooling

Your app is already configured with connection pooling in `lib/database.ts`:

```typescript
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
```

### 2. Environment-Specific Settings

Make sure your production environment variables are set correctly:

- **SSL Mode**: Required for most hosted PostgreSQL
- **Connection Limits**: Adjust based on your database plan
- **JWT Secret**: Use a strong, unique secret for production

### 3. Performance Monitoring

Add these to monitor your app:

- **Vercel Analytics**: Enable in project settings
- **Database Monitoring**: Use your database provider's monitoring
- **Error Tracking**: Consider Sentry integration

## 🚨 Important Security Notes

### Before Going Live:

1. **Change Default Passwords**: Update any default credentials
2. **Environment Variables**: Never commit secrets to Git
3. **Database Access**: Restrict database access to Vercel IPs if possible
4. **API Rate Limiting**: Consider implementing rate limiting
5. **Input Validation**: Ensure all user inputs are validated

### Recommended Headers (already configured):

```javascript
// Your next.config.js already includes security headers:
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        // ... other security headers
      ],
    },
  ]
}
```

## 🔄 Migration from Supabase

If you have existing data in Supabase:

### 1. Export Supabase Data

```sql
-- In Supabase SQL editor
COPY (SELECT * FROM auth.users) TO '/tmp/users.csv' WITH CSV HEADER;
COPY (SELECT * FROM tbl_tickets) TO '/tmp/tickets.csv' WITH CSV HEADER;
-- ... export other tables
```

### 2. Import to PostgreSQL

Use the migration script:

```bash
# Set environment variables for both databases
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-supabase-service-key
DATABASE_URL=your-new-postgresql-url

# Run migration
npx tsx scripts/migrate-from-supabase.ts
```

## 📊 Monitoring & Maintenance

### Database Backups

Most managed PostgreSQL providers offer automatic backups. Verify:

1. **Neon**: 7-day point-in-time recovery
2. **Supabase**: Daily automated backups
3. **Vercel Postgres**: Automated backups included

### Performance Monitoring

Monitor these metrics:

- **Response Times**: Vercel provides built-in analytics
- **Database Connections**: Monitor pool usage
- **Error Rates**: Check Vercel function logs
- **User Growth**: Track registration rates

## 🆘 Troubleshooting

### Common Issues:

**Database Connection Errors:**
```
Error: connect ETIMEDOUT
```
- Check DATABASE_URL format
- Verify SSL settings (`?sslmode=require`)
- Confirm database is accessible from internet

**Build Failures:**
```
Module not found: Can't resolve '@/lib/database'
```
- Ensure all imports use correct paths
- Check TypeScript configuration

**Environment Variable Issues:**
- Verify all required env vars are set in Vercel
- Check for typos in variable names
- Ensure secrets are properly formatted

### Getting Help:

1. **Vercel Support**: Check Vercel documentation and community
2. **Database Provider**: Each provider has support channels
3. **Application Logs**: Check Vercel function logs for errors

## 🎉 Success Checklist

- [ ] Database created and accessible
- [ ] Vercel project deployed
- [ ] Environment variables configured
- [ ] Database schema initialized
- [ ] User registration/login works
- [ ] Tickets can be created and viewed
- [ ] File uploads working (if used)
- [ ] Email notifications configured (if used)
- [ ] Performance is acceptable
- [ ] Security headers are active
- [ ] Backups are configured

---

Your PostgreSQL-based ticketing system should now be live on Vercel! 🚀

For additional support, check the Vercel documentation or create an issue in your repository.