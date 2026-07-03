-- ============================================
-- TICKETING SYSTEM - POSTGRESQL DATABASE SETUP
-- Pure PostgreSQL (No Supabase Dependencies)
-- Safe to run multiple times (idempotent)
-- ============================================

-- ============================================
-- STEP 1: Create database extensions
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable array functions
CREATE EXTENSION IF NOT EXISTS "intarray";

-- ============================================
-- STEP 2: Create tables
-- ============================================

-- Users table (replacing auth.users dependency)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- For authentication if not using external auth
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'agent', 'admin')),
  phone VARCHAR(50),
  job_title VARCHAR(255),
  company VARCHAR(255),
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(50) DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  color VARCHAR(50) DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Ticket types table
CREATE TABLE IF NOT EXISTS ticket_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Custom statuses table
CREATE TABLE IF NOT EXISTS custom_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  color VARCHAR(50) NOT NULL DEFAULT '#10B981',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number SERIAL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  type_id UUID REFERENCES ticket_types(id) ON DELETE SET NULL,
  product VARCHAR(100),
  product_reference_number VARCHAR(255),
  priority VARCHAR(50) DEFAULT 'MEDIUM' NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  status VARCHAR(50) DEFAULT 'UNTOUCHED' NOT NULL CHECK (status IN ('UNTOUCHED', 'PENDING', 'OPENED', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'SOLVED', 'CLOSED')),
  tags UUID[] DEFAULT '{}',
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- Internal comments for admin/staff only
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  mime_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Solutions/Knowledge base table
CREATE TABLE IF NOT EXISTS solutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  steps TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  tags UUID[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  solution_id UUID REFERENCES solutions(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CHECK (ticket_id IS NOT NULL OR solution_id IS NOT NULL),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  position VARCHAR(255),
  department VARCHAR(255),
  company VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- User sessions table (if implementing custom auth)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================
-- STEP 2B: Bring existing databases up to date
-- ============================================

ALTER TABLE feedback ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS solution_id UUID REFERENCES solutions(id) ON DELETE SET NULL;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL;

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'users'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', constraint_name);
  END LOOP;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'users'
      AND c.conname = 'users_role_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'agent', 'admin'));
  END IF;
END;
$$;

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'feedback'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%ticket_id%'
      AND pg_get_constraintdef(c.oid) LIKE '%solution_id%'
  LOOP
    EXECUTE format('ALTER TABLE feedback DROP CONSTRAINT %I', constraint_name);
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'feedback'
      AND column_name = 'category'
  ) THEN
    ALTER TABLE feedback ALTER COLUMN category DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'feedback'
      AND column_name = 'message'
  ) THEN
    ALTER TABLE feedback ALTER COLUMN message DROP NOT NULL;
  END IF;

  ALTER TABLE feedback ADD CONSTRAINT feedback_target_check CHECK (ticket_id IS NOT NULL OR solution_id IS NOT NULL) NOT VALID;
END;
$$;

-- ============================================
-- STEP 3: Create indexes for performance
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Tickets indexes
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_category_id ON tickets(category_id);
CREATE INDEX IF NOT EXISTS idx_tickets_type_id ON tickets(type_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_updated_at ON tickets(updated_at);
CREATE INDEX IF NOT EXISTS idx_tickets_tags ON tickets USING GIN(tags);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- Attachments indexes
CREATE INDEX IF NOT EXISTS idx_attachments_ticket_id ON attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user_id ON attachments(user_id);

-- Solutions indexes
CREATE INDEX IF NOT EXISTS idx_solutions_category_id ON solutions(category_id);
CREATE INDEX IF NOT EXISTS idx_solutions_is_published ON solutions(is_published);
CREATE INDEX IF NOT EXISTS idx_solutions_tags ON solutions USING GIN(tags);

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_ticket_id ON feedback(ticket_id);
CREATE INDEX IF NOT EXISTS idx_feedback_solution_id ON feedback(solution_id);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- ============================================
-- STEP 4: Create functions and triggers
-- ============================================

-- Function to automatically update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update ticket resolution time
CREATE OR REPLACE FUNCTION update_ticket_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Set resolved_at when status changes to 'SOLVED'
  IF NEW.status = 'SOLVED' AND OLD.status != 'SOLVED' THEN
    NEW.resolved_at = NOW();
  -- Clear resolved_at if status changes away from 'SOLVED'
  ELSIF NEW.status != 'SOLVED' AND OLD.status = 'SOLVED' THEN
    NEW.resolved_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment solution view count
CREATE OR REPLACE FUNCTION increment_solution_views(solution_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE solutions 
  SET view_count = view_count + 1 
  WHERE id = solution_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to increment solution helpful count
CREATE OR REPLACE FUNCTION increment_solution_helpful(solution_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE solutions 
  SET helpful_count = helpful_count + 1 
  WHERE id = solution_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 5: Create triggers
-- ============================================

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_solutions_updated_at ON solutions;
CREATE TRIGGER update_solutions_updated_at
  BEFORE UPDATE ON solutions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feedback_updated_at ON feedback;
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ticket resolution trigger
DROP TRIGGER IF EXISTS update_ticket_resolved_at_trigger ON tickets;
CREATE TRIGGER update_ticket_resolved_at_trigger
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_resolved_at();

-- ============================================
-- STEP 6: Create views for analytics and reporting
-- ============================================

-- Tickets analytics view
CREATE OR REPLACE VIEW ticket_analytics AS
SELECT
  COUNT(*) as total_tickets,
  COUNT(*) FILTER (WHERE status = 'UNTOUCHED') as untouched_count,
  COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
  COUNT(*) FILTER (WHERE status = 'OPENED') as opened_count,
  COUNT(*) FILTER (WHERE status = 'SOLVED') as solved_count,
  COUNT(*) FILTER (WHERE priority = 'LOW') as low_priority,
  COUNT(*) FILTER (WHERE priority = 'MEDIUM') as medium_priority,
  COUNT(*) FILTER (WHERE priority = 'HIGH') as high_priority,
  COUNT(*) FILTER (WHERE priority = 'URGENT') as urgent_priority,
  COUNT(DISTINCT user_id) as unique_users,
  COALESCE(
    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) FILTER (WHERE resolved_at IS NOT NULL),
    0
  )::numeric(10,2) AS avg_resolution_hours
FROM tickets;

-- Detailed ticket view with related data
DROP VIEW IF EXISTS ticket_details;
CREATE OR REPLACE VIEW ticket_details AS
SELECT 
  t.id,
  t.number,
  t.title,
  t.description,
  t.user_id,
  t.assigned_to,
  t.category_id,
  t.type_id,
  t.tags,
  t.priority,
  t.status,
  t.product,
  t.product_reference_number,
  t.created_at,
  t.updated_at,
  t.resolved_at,
  
  -- User information
  u.email as creator_email,
  u.full_name as creator_name,
  
  -- Assigned user information
  au.email as assigned_email,
  au.full_name as assigned_name,
  
  -- Category information
  c.name as category_name,
  c.color as category_color,
  
  -- Type information
  tt.name as type_name,
  tt.description as type_description,
  
  -- Tag information (array of tag names)
  ARRAY(
    SELECT tg.name 
    FROM tags tg 
    WHERE tg.id = ANY(t.tags)
  ) as tag_names,
  
  -- Comment count
  (SELECT COUNT(*) FROM comments WHERE ticket_id = t.id) as comment_count,
  
  -- Attachment count
  (SELECT COUNT(*) FROM attachments WHERE ticket_id = t.id) as attachment_count

FROM tickets t
LEFT JOIN users u ON t.user_id = u.id
LEFT JOIN users au ON t.assigned_to = au.id
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN ticket_types tt ON t.type_id = tt.id;

-- User statistics view
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  
  -- Ticket statistics
  COUNT(t.id) as total_tickets_created,
  COUNT(t.id) FILTER (WHERE t.status = 'SOLVED') as tickets_solved,
  COUNT(at.id) as total_tickets_assigned,
  COUNT(at.id) FILTER (WHERE at.status = 'SOLVED') as assigned_tickets_solved,
  
  -- Comment count
  COUNT(c.id) as total_comments,
  
  u.created_at,
  u.last_login

FROM users u
LEFT JOIN tickets t ON u.id = t.user_id
LEFT JOIN tickets at ON u.id = at.assigned_to
LEFT JOIN comments c ON u.id = c.user_id
GROUP BY u.id, u.email, u.full_name, u.role, u.created_at, u.last_login;

-- ============================================
-- STEP 7: Seed initial data
-- ============================================

-- Insert default categories
INSERT INTO categories (name, description, color, created_at) VALUES
  ('Bug Report', 'Software defects and issues', '#EF4444', NOW()),
  ('Technical Issue', 'Technical support requests', '#F59E0B', NOW()),
  ('Account Inquiry', 'Account related questions', '#3B82F6', NOW()),
  ('New Feature Request', 'Requests for new functionality', '#10B981', NOW()),
  ('Other', 'General inquiries and other issues', '#6B7280', NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert default tags
INSERT INTO tags (name, color, created_at) VALUES
  ('frontend', '#8B5CF6', NOW()),
  ('backend', '#06B6D4', NOW()),
  ('urgent', '#EF4444', NOW()),
  ('documentation', '#84CC16', NOW()),
  ('mobile', '#F59E0B', NOW()),
  ('performance', '#EC4899', NOW()),
  ('security', '#DC2626', NOW()),
  ('enhancement', '#10B981', NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert default ticket types
INSERT INTO ticket_types (name, description, icon, created_at) VALUES
  ('Feature Request', 'Request for new functionality or improvements', '🚀', NOW()),
  ('Bug Report', 'Report of a software defect or issue', '🐛', NOW()),
  ('Support Ticket', 'General support inquiry or question', '💬', NOW()),
  ('Maintenance', 'Scheduled maintenance or updates', '🔧', NOW()),
  ('Security', 'Security-related issues or concerns', '🔒', NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert default custom statuses
INSERT INTO custom_statuses (name, color, is_active, sort_order, created_at) VALUES
  ('UNTOUCHED', '#6B7280', TRUE, 1, NOW()),
  ('PENDING', '#F59E0B', TRUE, 2, NOW()),
  ('IN_PROGRESS', '#3B82F6', TRUE, 3, NOW()),
  ('WAITING_FOR_CUSTOMER', '#8B5CF6', TRUE, 4, NOW()),
  ('SOLVED', '#10B981', TRUE, 5, NOW()),
  ('CLOSED', '#374151', TRUE, 6, NOW())
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- STEP 8: Create admin user (optional)
-- ============================================

-- Uncomment and modify the following to create an admin user
-- INSERT INTO users (email, full_name, role, email_verified, created_at) VALUES
--   ('admin@example.com', 'System Administrator', 'admin', TRUE, NOW())
-- ON CONFLICT (email) DO NOTHING;

-- ============================================
-- STEP 9: Verification queries
-- ============================================

-- Display table counts
SELECT 'Database setup completed successfully!' as status;

SELECT 
  schemaname,
  tablename,
  (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
FROM (
  SELECT 
    schemaname, 
    tablename, 
    query_to_xml(format('SELECT COUNT(*) as cnt FROM %I.%I', schemaname, tablename), false, true, '') as xml_count
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND tablename IN ('users', 'tickets', 'comments', 'attachments', 'solutions', 'categories', 'tags', 'ticket_types', 'custom_statuses', 'feedback', 'contacts')
) t
ORDER BY tablename;

-- Display available categories and types
SELECT 'Available Categories:' as info;
SELECT name, color FROM categories ORDER BY name;

SELECT 'Available Ticket Types:' as info;
SELECT name, description FROM ticket_types ORDER BY name;

SELECT 'Available Tags:' as info;
SELECT name, color FROM tags ORDER BY name;

-- ============================================
-- END OF SETUP
-- ============================================
