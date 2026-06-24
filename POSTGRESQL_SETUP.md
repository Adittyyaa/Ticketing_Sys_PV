# PostgreSQL Database Setup Guide

This guide will help you convert your Supabase-based ticketing system to use PostgreSQL.

## 🚀 Quick Start with Docker

### 1. Start PostgreSQL with Docker

```bash
# Start PostgreSQL and pgAdmin
docker-compose up -d

# Check if services are running
docker-compose ps
```

This will start:
- **PostgreSQL** on port `5432`
- **pgAdmin** (database management UI) on port `5050`

### 2. Access pgAdmin (Optional)

Visit `http://localhost:5050` and login with:
- **Email**: `admin@example.com`
- **Password**: `admin_password_here`

## 📋 Manual PostgreSQL Setup

If you prefer to install PostgreSQL manually:

### 1. Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
Download from [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ticketing_system;

# Create user (optional)
CREATE USER ticketing_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ticketing_system TO ticketing_user;

# Exit
\q
```

### 3. Run Database Setup

```bash
# Run the setup script
psql -U postgres -d ticketing_system -f database-setup-postgresql.sql
```

## ⚙️ Environment Configuration

### 1. Copy Environment File

```bash
cp .env.example .env.local
```

### 2. Update Database Connection

Edit `.env.local`:

```env
# For Docker setup
DATABASE_URL=postgresql://postgres:your_secure_password_here@localhost:5432/ticketing_system

# For manual setup
DATABASE_URL=postgresql://ticketing_user:your_password@localhost:5432/ticketing_system

# Generate a secure JWT secret
JWT_SECRET=your-super-secret-jwt-key-here

# Other required settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Generate Secure Keys

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate API key
openssl rand -hex 32
```

## 🔄 Migrating from Supabase

If you have existing data in Supabase:

### 1. Install Dependencies

```bash
npm install bcryptjs @types/bcryptjs
```

### 2. Set Migration Environment Variables

Add to your `.env.local`:

```env
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

### 3. Run Migration

```bash
# Make migration script executable
chmod +x scripts/migrate-from-supabase.ts

# Run migration
npx tsx scripts/migrate-from-supabase.ts
```

**Note**: All migrated users will have the default password `changeme123` and should reset their passwords.

## 📦 Required Dependencies

Add these to your `package.json`:

```bash
npm install pg @types/pg
npm install jose bcryptjs @types/bcryptjs
npm install uuid @types/uuid
```

## 🔧 Application Updates

### 1. Remove Supabase Dependencies (Optional)

If you want to completely remove Supabase:

```bash
npm uninstall @supabase/supabase-js
```

### 2. Update API Routes

Replace Supabase client calls with the new database service:

```typescript
// Old (Supabase)
const { data, error } = await supabase
  .from('tbl_tickets')
  .select('*')

// New (PostgreSQL)
import { getTickets } from '@/lib/database-service'
const tickets = await getTickets()
```

### 3. Update Authentication

Replace Supabase auth with the new auth system:

```typescript
// Old (Supabase)
const { data: { user } } = await supabase.auth.getUser()

// New (PostgreSQL)
import { getCurrentUser } from '@/lib/auth'
const user = await getCurrentUser(request)
```

## 🏗️ Database Schema

The new PostgreSQL schema includes:

### Core Tables
- `users` - User accounts with authentication
- `tickets` - Support tickets
- `comments` - Ticket comments
- `attachments` - File attachments
- `categories` - Ticket categories
- `tags` - Ticket tags
- `ticket_types` - Types of tickets
- `custom_statuses` - Custom status definitions

### Support Tables
- `solutions` - Knowledge base articles
- `feedback` - User feedback
- `contacts` - Contact directory
- `user_sessions` - Authentication sessions

### Views
- `ticket_details` - Enriched ticket data with joins
- `ticket_analytics` - Ticket statistics
- `user_statistics` - User activity stats

## 🔍 Verification

### 1. Test Database Connection

```bash
# Test connection
npx tsx -e "
import { checkConnection } from './lib/database';
checkConnection().then(result => console.log('Connection:', result ? '✅' : '❌'));
"
```

### 2. Check Table Counts

```sql
SELECT tablename, 
       (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
FROM (
  SELECT tablename, 
         query_to_xml(format('SELECT COUNT(*) as cnt FROM %I', tablename), false, true, '') as xml_count
  FROM pg_tables 
  WHERE schemaname = 'public'
) t
ORDER BY tablename;
```

## 🚨 Important Notes

### Security
- Change all default passwords before production
- Use environment variables for all secrets
- Enable SSL in production
- Regularly backup your database

### Performance
- The setup includes optimized indexes
- Monitor query performance in production
- Consider connection pooling for high traffic

### Backup
```bash
# Create backup
pg_dump -U postgres ticketing_system > backup.sql

# Restore backup
psql -U postgres ticketing_system < backup.sql
```

## 🆘 Troubleshooting

### Connection Issues

**Error: `ECONNREFUSED`**
- Check if PostgreSQL is running: `brew services list` (macOS) or `systemctl status postgresql` (Linux)
- Verify port 5432 is not blocked
- Check connection string in `.env.local`

**Error: `database "ticketing_system" does not exist`**
- Create the database: `createdb -U postgres ticketing_system`

### Permission Issues

**Error: `permission denied for relation`**
- Grant permissions: `GRANT ALL ON ALL TABLES IN SCHEMA public TO your_user;`
- Grant sequence permissions: `GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO your_user;`

### Migration Issues

**Error during migration:**
- Check Supabase credentials
- Ensure target PostgreSQL database is empty or use `ON CONFLICT` handling
- Check logs for specific table issues

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker PostgreSQL](https://hub.docker.com/_/postgres)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)
- [Next.js Database Integration](https://nextjs.org/docs/app/building-your-application/data-fetching)

---

For additional help or issues, check the application logs or create an issue in the repository.