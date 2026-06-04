# Database Schema Documentation

## Entity Relationship Diagram

```
┌─────────────────────────┐
│        USERS            │
├─────────────────────────┤
│ PK id (uuid)            │
│    email (varchar)      │
│    full_name (varchar)  │
│    avatar_url (varchar) │
│    role (enum)          │
│    created_at (timestamp)│
└───────────┬─────────────┘
            │
            │ 1:N
            │
┌───────────▼─────────────┐         ┌─────────────────────────┐
│       TICKETS           │ 1:N     │      COMMENTS           │
├─────────────────────────┤◄────────├─────────────────────────┤
│ PK id (uuid)            │         │ PK id (uuid)            │
│    number (int)         │         │ FK ticket_id (uuid)     │
│    title (varchar)      │         │ FK user_id (uuid)       │
│    description (text)   │         │    content (text)       │
│    category (enum)      │         │    commenter_name (varchar)│
│    priority (enum)      │         │    commenter_email (varchar)│
│    status (enum)        │         │    created_at (timestamp)│
│ FK user_id (uuid)       │         │    updated_at (timestamp)│
│    assigned_to (uuid)   │         └─────────────────────────┘
│    tags (text[])        │
│    created_at (timestamp)│
│    updated_at (timestamp)│
└───────────┬─────────────┘
            │
            │ 1:N
            │
┌───────────▼─────────────┐
│     ATTACHMENTS         │
├─────────────────────────┤
│ PK id (uuid)            │
│ FK ticket_id (uuid)     │
│ FK user_id (uuid)       │
│    file_name (varchar)  │
│    file_path (varchar)  │
│    file_size (int)      │
│    file_type (varchar)  │
│    created_at (timestamp)│
└─────────────────────────┘
```

## Relationships

1. **USERS → TICKETS** (1:N)
   - One user can create many tickets
   - Foreign Key: `tickets.user_id` → `users.id`

2. **TICKETS → COMMENTS** (1:N)
   - One ticket can have many comments
   - Foreign Key: `comments.ticket_id` → `tickets.id`

3. **USERS → COMMENTS** (1:N)
   - One user can create many comments
   - Foreign Key: `comments.user_id` → `users.id`

4. **TICKETS → ATTACHMENTS** (1:N)
   - One ticket can have many attachments
   - Foreign Key: `attachments.ticket_id` → `tickets.id`

5. **USERS → ATTACHMENTS** (1:N)
   - One user can upload many attachments
   - Foreign Key: `attachments.user_id` → `users.id`

## Storage

- **Bucket Name**: `ticket-attachments`
- **Storage Path**: `{user_id}/{ticket_id}/{timestamp}-{filename}`
- **Max File Size**: 10MB
- **Access**: Private (authenticated users only)

## Indexes

### TICKETS Table
- Primary Key: `id`
- Index on: `user_id` (for user's tickets query)
- Index on: `status` (for filtering)
- Index on: `priority` (for filtering)
- Index on: `created_at` (for sorting)

### COMMENTS Table
- Primary Key: `id`
- Index on: `ticket_id` (for ticket comments query)
- Index on: `created_at` (for sorting)

### ATTACHMENTS Table
- Primary Key: `id`
- Index on: `ticket_id` (for ticket attachments query)
- Index on: `user_id` (for user uploads query)

## Row Level Security (RLS) Policies

### USERS Table
1. **users_select_own**: Users can view their own record
2. **users_insert_own**: Users can insert their own record
3. **users_update_own**: Users can update their own record

### TICKETS Table
1. **tickets_select_all_authenticated**: All authenticated users can view all tickets
2. **tickets_insert_own**: Users can create tickets
3. **tickets_update_own_or_admin**: Users can update own tickets, admins can update any
4. **tickets_delete_own_or_admin**: Users can delete own tickets, admins can delete any

### COMMENTS Table
- RLS disabled for now (to avoid recursion issues)

### ATTACHMENTS Table
- Access controlled through authenticated user checks

## Enums

### UserRole
- `user` - Regular user (default)
- `admin` - Administrator

### Priority
- `LOW`
- `MEDIUM`
- `HIGH`
- `URGENT`

### Status
- `UNTOUCHED` - New ticket, not yet viewed
- `PENDING` - Awaiting action
- `OPENED` - Being worked on
- `SOLVED` - Issue resolved

### Category
- `Bug Report`
- `Technical Issue`
- `Account Inquiry`
- `New Feature Request`
- `Other`
