-- ============================================
-- PERFORMANCE OPTIMIZATION FIXES
-- ============================================

-- 1. Add Missing Indexes for Better Performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_category_id ON tickets(category_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_status_priority ON tickets(status, priority);

-- Indexes for comments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_ticket_id ON comments(ticket_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Indexes for attachments  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attachments_ticket_id ON attachments(ticket_id);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_user_status ON tickets(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_assigned_status ON tickets(assigned_to, status) WHERE assigned_to IS NOT NULL;

-- 2. Create Optimized View WITHOUT Expensive Subqueries
DROP VIEW IF EXISTS ticket_details_fast;
CREATE VIEW ticket_details_fast AS
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
  tt.description as type_description

FROM tickets t
LEFT JOIN users u ON t.user_id = u.id
LEFT JOIN users au ON t.assigned_to = au.id
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN ticket_types tt ON t.type_id = tt.id;

-- 3. Create Separate Functions for Counts (Called Only When Needed)
CREATE OR REPLACE FUNCTION get_ticket_comment_count(ticket_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*)::INTEGER FROM comments WHERE ticket_id = ticket_uuid);
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_ticket_attachment_count(ticket_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*)::INTEGER FROM attachments WHERE ticket_id = ticket_uuid);
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_ticket_tag_names(tag_ids UUID[])
RETURNS TEXT[] AS $$
BEGIN
  RETURN (SELECT ARRAY_AGG(name) FROM tags WHERE id = ANY(tag_ids));
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Create Materialized View for Dashboard Analytics (Refresh Periodically)
DROP MATERIALIZED VIEW IF EXISTS dashboard_stats;
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT 
  COUNT(*) as total_tickets,
  COUNT(CASE WHEN status = 'UNTOUCHED' THEN 1 END) as untouched_tickets,
  COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_tickets,
  COUNT(CASE WHEN status = 'OPENED' THEN 1 END) as opened_tickets,
  COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_tickets,
  COUNT(CASE WHEN status = 'SOLVED' THEN 1 END) as solved_tickets,
  COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as closed_tickets,
  COUNT(CASE WHEN priority = 'HIGH' THEN 1 END) as high_priority,
  COUNT(CASE WHEN priority = 'MEDIUM' THEN 1 END) as medium_priority,
  COUNT(CASE WHEN priority = 'LOW' THEN 1 END) as low_priority,
  COUNT(CASE WHEN priority = 'URGENT' THEN 1 END) as urgent_priority,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as tickets_today,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as tickets_this_week,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as tickets_this_month,
  NOW() as last_updated
FROM tickets;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX ON dashboard_stats ((1));

-- 5. Function to Refresh Dashboard Stats
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- 6. Add Partial Indexes for Common Filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_active_status 
  ON tickets(created_at DESC) 
  WHERE status NOT IN ('SOLVED', 'CLOSED');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_urgent_priority 
  ON tickets(created_at DESC) 
  WHERE priority IN ('HIGH', 'URGENT');

-- 7. Analyze Tables for Query Planner
ANALYZE tickets;
ANALYZE users;
ANALYZE comments;
ANALYZE attachments;
ANALYZE categories;
ANALYZE ticket_types;
ANALYZE tags;