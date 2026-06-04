# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Set your project name and database password
5. Wait for the project to initialize

## 2. Get Your Credentials

1. In your Supabase dashboard, go to **Settings → API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Paste these into `.env.local`

## 3. Create Database Tables

Go to **SQL Editor** in your Supabase dashboard and run this SQL:

```sql
-- Create users table (already exists via auth)
-- Create tickets table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number SERIAL UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  status VARCHAR(20) NOT NULL DEFAULT 'UNTOUCHED',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  assigned_to UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  CONSTRAINT valid_status CHECK (status IN ('UNTOUCHED', 'PENDING', 'OPENED', 'SOLVED')),
  CONSTRAINT valid_category CHECK (category IN ('Bug Report', 'Technical Issue', 'Account Inquiry', 'New Feature Request', 'Other'))
);

-- Create index for faster queries
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);

-- Enable Row Level Security
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only see their own tickets
CREATE POLICY "Users can view their own tickets"
  ON tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy: Users can create tickets
CREATE POLICY "Users can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: Users can update their own tickets
CREATE POLICY "Users can update their own tickets"
  ON tickets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: Users can delete their own tickets
CREATE POLICY "Users can delete their own tickets"
  ON tickets FOR DELETE
  USING (auth.uid() = user_id);
```

## 4. Enable Authentication

1. Go to **Authentication → Providers**
2. Enable **Email** (already enabled by default)
3. Configure email settings if needed

## 5. Environment Variables

Create `.env.local` in your project root:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

That's it! Your Supabase database is ready.
