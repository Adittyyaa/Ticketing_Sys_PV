# PV Advisory Ticketing System — Technical Architecture & Internals

## 1. System Overview

PV Advisory Ticketing System is a monorepo-distributed full-stack application built with a **Next.js 16 frontend** (React 19, TypeScript, Ant Design 6, Tailwind CSS 3) and an **Express.js backend** (TypeScript, Sequelize ORM, PostgreSQL). It implements role-based access control (RBAC), JWT stateless authentication, paginated REST APIs, a client-side state layer via Zustand, and a NeDB/PostgreSQL-backed persistence layer with raw parameterized queries and ORM hybrid access.

---

## 2. Repository Structure

```
/Users/adityasharma/Music/PV_Advisory_Ticketing_System/
├── backend/
│   ├── src/
│   │   ├── server.ts                 # Express bootstrap, middleware, error handlers
│   │   ├── api/                      # Feature-scoped API handlers (admin, auth, tickets, etc.)
│   │   ├── config/                   # SQL schema & seed data
│   │   ├── lib/
│   │   │   ├── sequelize.ts          # Sequelize instance, SSL pool config, connection sync
│   │   │   ├── database.ts           # node-postgres Pool, query(), transaction(), safeQuery()
│   │   │   ├── database-service.ts   # Data-access layer (raw SQL via parameterized queries)
│   │   │   ├── auth.ts               # Password hashing, JWT minting/verification, RBAC guards
│   │   │   ├── constants.ts          # Enums for priority/status, validation limits
│   │   │   ├── admin-auth.ts         # Admin-specific auth header derivation
│   │   │   └── store.ts              # Zustand store (fallback for legacy/cross-cutting state)
│   │   ├── models/                   # Sequelize model definitions with hooks & associations
│   │   ├── routes/                   # Express routers (auth, tickets, admin, solutions, feedback)
│   │   └── types/                    # Shared TypeScript interfaces & enums
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx            # Root layout, global providers (Theme, Antd, InactivityLogout)
│   │   │   ├── page.tsx              # Landing/auth redirect guard
│   │   │   ├── auth/callback/page.tsx # Post-auth callback handler
│   │   │   ├── tickets/              # Ticket inbox, detail, creation pages
│   │   │   ├── admin/                # Admin overview, settings, user management
│   │   │   ├── solutions/            # Knowledge base / public FAQ
│   │   │   ├── contact/              # Contact form
│   │   │   └── faq/                  # FAQ page
│   │   ├── components/
│   │   │   ├── AppShell.tsx          # Primary layout shell (Sidebar, TopBar, content area)
│   │   │   ├── TicketTable.tsx       # AG-Grid / Antd Table integration for ticket listing
│   │   │   ├── TicketCardView.tsx    # Card-based ticket visualization
│   │   │   ├── TicketInboxView.tsx   # Kanban / inbox-style layout
│   │   │   ├── TicketFilterDrawer.tsx# Advanced filtering & search drawer
│   │   │   ├── CommentsSection.tsx   # Threaded comments component
│   │   │   ├── AttachmentsSection.tsx# File attachment management
│   │   │   ├── FeedbackModal.tsx     # CSAT/feedback collection modal
│   │   │   ├── InactivityLogoutProvider.tsx # Auto-logout on inactivity (security)
│   │   │   └── AntdThemeProvider.tsx  # Ant Design ConfigProvider wrapper
│   │   ├── contexts/ThemeContext.tsx  # Dark/light theme toggle via CSS custom properties
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── lib/
│   │   │   ├── store.ts              # Zustand slices (auth, tickets)
│   │   │   └── admin-api.ts          # Admin API helper (auth header injection)
│   │   └── types/                    # Frontend-shared TypeScript types
│   │   ├── next.config.js            # Next.js config: standalone output, image domains, security headers
│   │   ├── tailwind.config.js
│   │   └── postcss.config.js
├── docker-compose.yml
├── package.json                      # Workspace root scripts (concurrently, build, lint, db setup)
└── .env
```

---

## 3. Technology Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + tsx (ts-node alternative with ESM/CJS flexibility) |
| Framework | Express.js 4.x |
| ORM | Sequelize 6.x (model definitions, associations, hooks, migrations optional) |
| Query Runner | node-postgres (`pg`) with `pg-pool` for raw SQL and transactions |
| Auth | `jose` (JWT HS256), `bcryptjs` (salt rounds 12) |
| Validation | Sequelize built-in validators + manual route-level guards |
| Database | PostgreSQL (hosted on Neon.tech, AWS us-east-1 region) |
| Scripting | TypeScript 5.9+, ESLint 8 |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Components where possible) |
| UI Library | Ant Design 6 (`antd`) + Tailwind CSS 3.3 |
| Icons | Lucide React |
| State Management | Zustand 4 (client-side slices for auth, tickets, filters) |
| PDF / Export | jsPDF + html2canvas |
| Date Utilities | date-fns |
| Auth Flow | JWT stored in memory via Zustand; API routes called from client components |

---

## 4. Database Architecture

### 4.1 Connection & Pooling

**`backend/src/lib/database.ts`**
- Exposes a `pg.Pool` singleton configured with `max: 20`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 2000`.
- `DATABASE_URL` is read from environment; a fallback placeholder URL is logged in dev.
- `safeQuery()` is the primary data-access abstraction, logging queries in non-production environments.

**`backend/src/lib/sequelize.ts`**
- Exposes a `Sequelize` instance PostgreSQL dialect.
- SSL is enforced in production (`require: true`, `rejectUnauthorized: false` for self-signed or Neon-managed certs).
- Connection pooling: `max: 20`, `acquire: 30000`, `idle: 10000`.

### 4.2 Schema (PostgreSQL)

Tables are idempotently created via `backend/src/config/database-setup-postgresql.sql`.

#### Core Entities

| Table | Primary Key | Notes |
|-------|-------------|-------|
| `users` | `id` UUID (V4) | Email unique, role enum (`user`, `admin`, `agent`) |
| `tickets` | `id` UUID + `number` SERIAL unique | Status enum, priority enum, GIN index on `tags[]`, FK to users, categories, ticket_types |
| `categories` | `id` UUID | Name unique, hex color code |
| `tags` | `id` UUID | Name unique |
| `ticket_types` | `id` UUID | Icon field, name unique |
| `custom_statuses` | `id` UUID | Sortable, active flag |
| `comments` | `id` UUID | `is_internal` flag for staff-only notes, FK to tickets + users |
| `attachments` | `id` UUID | `mime_type`, `file_size`, FK to tickets + users |
| `solutions` | `id` UUID | `is_published`, `view_count`, `helpful_count`, `steps[]` TEXT array |
| `feedback` | `id` UUID | Rating 1–5, category, FK to tickets |
| `contacts` | `id` UUID | Public contact directory |
| `user_sessions` | `id` UUID | Optional session tokens |

#### Materialized / Virtual Views

- **`ticket_details`** — Denormalized join view used by read paths: includes creator/assignee info, category/type names, tag names (via subselect), comment count, attachment count.
- **`ticket_analytics`** — Aggregated counts per status/priority, unique user count, average resolution time in hours.
- **`user_statistics`** — Per-user ticket creation totals, solved counts, assigned tickets, comment counts.

#### Triggers & Functions

- `update_updated_at_column()` — BEFORE UPDATE trigger on users, tickets, comments, solutions to refresh `updated_at`.
- `update_ticket_resolved_at()` — Auto-sets/clears `resolved_at` when status transitions to/from `SOLVED`.
- `increment_solution_views()` / `increment_solution_helpful()` — PL/pgSQL functions to safely increment counters.

---

## 5. Backend Architecture

### 5.1 Server Bootstrap

**`backend/src/server.ts`**
- Express app instantiated with Helmet (security headers), CORS (configurable origin), `express.json()`/`urlencoded()`, Morgan dev logger.
- Routers mounted under:
  - `/api/auth`
  - `/api/tickets`
  - `/api/admin`
  - `/api/solutions`
  - `/api/feedback`
- Global error handler distinguishes authentication vs. authorization errors (matching string messages) and masks stack traces in production.

### 5.2 Authentication Flow

**`backend/src/lib/auth.ts`**

1. **Registration** — `register()` validates email uniqueness, hashes password with bcrypt (`saltRounds: 12`), inserts user with `email_verified: true` (auto-verified for this MVP), and returns a JWT.
2. **Login** — `login()` retrieves user by email, compares password, updates `last_login`, issues JWT.
3. **JWT Structure** — HS256, claims: `{ userId, role, iat }`, TTL: `7d`.
4. **Authorization** — `requireAuth(authHeader)` and `requireAdmin(authHeader)` throw typed string errors caught by global handler to return 401/403.
5. **Password Reset** — `generateResetToken()` creates a short-lived (1h) JWT with `type: 'password_reset'`; `resetPassword()` verifies and updates (placeholder implementation exists in `auth.ts` but datastore update is logged-only).

### 5.3 Data Access Layer

**`backend/src/lib/database-service.ts`**

A dual-access data layer:
- **Sequelize Models** — Used for transactional integrity, hooks, association mixins, and bulk operations (e.g., `Ticket.getStatsByPriority()`).
- **Raw SQL via `safeQuery()`** — Used for CRUD against views (`ticket_details`), complex joins, pagination, and search. All queries are parameterized (`$1`, `$2`...) to prevent SQL injection.

Example flow for **pagination**:
1. Build dynamic `WHERE` clause from filters.
2. Run `SELECT COUNT(*) FROM tickets WHERE ...` for total count.
3. Run `SELECT * FROM ticket_details WHERE ... ORDER BY created_at DESC LIMIT $n OFFSET $n+1`.

### 5.4 Models

Key Sequelize models with instance/static methods, hooks, and indexed fields:
- **User** — `beforeSave` normalizes email to lowercase.
- **Ticket** — `beforeCreate` auto-assigns sequential `number` via `MAX(number)+1`. `beforeSave` trims title/description and auto-manages `resolved_at` on status changes.
- **Category** — Hex color validation.
- **Feedback** — Aggregation stats via `AVG`/`COUNT` raw queries.
- **Solution** — GIN index on tags array for full-text-ish filtering.

### 5.5 API Design

All endpoints return JSON envelopes:

```json
{
  "success": true,
  "data": { ... }
}
```

or

```json
{
  "error": "string message"
}
```

**Ticket CRUD (`/api/tickets`)**:
- `GET /` — Paginated list, RBAC (user sees own, admin/agent sees all), filter by status/priority/category/assigned_to.
- `GET /:id` — Detail via `ticket_details` view, RBAC ownership check.
- `POST /` — Creates ticket with structured data.
- `PUT /:id` — Patch update. Non-admin users restricted to `[title, description, priority]`.
- `GET /search/:query` — Text search (delegates to `searchTickets` in database-service, currently TODO-level).

**Incoming API (`POST /api/tickets/incoming`)**:
- Integration endpoint for external systems.
- Requires `x-api-key` header matching `TICKETING_API_KEY`.
- Finds or creates user by email, creates ticket.

**Admin API** — `/api/admin` serves protected user/ticket management, separated from public ticket routes for security layering.

---

## 6. Frontend Architecture

### 6.1 Routing (Next.js App Router)

- **`/`** — Landing component redirects to `/tickets` if authenticated, else `/auth`.
- **`/auth`** — Authentication entry point.
- **`/tickets`** — Ticket inbox with `TicketFilterDrawer` for advanced filter state.
- **`/tickets/new`** — Ticket creation form.
- **`/tickets/[id]`** — Ticket detail with comments, attachments, status transitions, feedback.
- **`/admin/overview`** — Admin dashboard (stats, recent tickets, overdue tickets).
- **`/admin/users`** — User management.
- **`/admin/settings`** — System settings (custom statuses, categories).
- **`/solutions`** — Public knowledge base.
- **`/contact`** — Contact form.
- **`/faq`** — FAQ page.

### 6.2 State Management

**Zustand (`frontend/src/lib/store.ts`)**:
- `useAuthStore` — `user`, `loading`, `isAdmin`.
- `useTicketStore` — `tickets[]`, `filters`, `customStatuses[]`, CRUD mutators.

Server state is fetched via direct `fetch('/api/...')` calls in `useEffect` hooks in page components, not abstracted into a dedicated React Query / SWR layer.

### 6.3 Component Architecture

- **AppShell** — Fixed sidebar (`Sidebar`) + top bar (`TopBar`) + main content outlet.
- **ThemeContext** — CSS custom properties toggled via class on root; consumed by inline styles in layouts.
- **InactivityLogoutProvider** — Tracks mouse move/key press; redirects to `/auth` after idle threshold.
- **AntdThemeProvider** — Wraps app in Ant Design `ConfigProvider` with dynamic theme token overrides.
- **Ticket Views** — Three interchangeable render modes: `TicketTableView` (data grid), `TicketCardView` (cards), `TicketInboxView` (kanban).

### 6.4 Security Headers

Configured in `next.config.js`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### 6.5 Image Optimization

- `output: 'standalone'` for Docker deployment.
- `remotePatterns` whitelist includes Supabase storage (`kqnuxtumkvhvkedaobcr.supabase.co`) and `localhost`.

---

## 7. Infrastructure & Deployment

### 7.1 Database

- **Provider**: Neon.tech (serverless PostgreSQL with auto-scaling & branching).
- **Hosted at**: `ep-soft-dawn-ahmf6sz2.c-3.us-east-1.aws.neon.tech`
- **SSL**: Required (`sslmode=require`).
- **URL**: Stored in `.env` as `DATABASE_URL`.

### 7.2 Containerization

**`docker-compose.yml`** orchestrates:
- `app` service running the Node.js backend.
- Volume mounts for backend code.
- Database exec for seeding via `setup-production-db.ts`.

**Backend Dockerfile**:
- Installs dependencies, runs `tsc` build, starts `node dist/server.js`.

**Frontend Dockerfile**:
- Builds Next.js standalone output.

### 7.3 Environment Configuration

**`.env`** (sensitive placeholders):
- `DATABASE_URL` — Neon PostgreSQL connection string.
- `JWT_SECRET` — Symmetric HMAC key for `jose` (fallback hardcoded in code if missing).
- `TICKETING_API_KEY` — Shared secret for external webhook integration.

**Build commands**:
- `npm run dev` — Starts both frontend (port 3000) and backend (port 3001) concurrently.
- `npm run build` — Builds both services.
- `npm run lint` — ESLint for both packages.
- `npm run db:setup` — Runs SQL against local/remote PostgreSQL.

---

## 8. Data Flow: Ticket Lifecycle

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. CREATE                                                        │
│    Frontend: POST /api/tickets                                   │
│    Backend : requireAuth → createTicket(userId, data)            │
│    Model   : beforeCreate hook sets next serial number           │
│    DB      : INSERT INTO tickets ... RETURNING *                 │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 2. ASSIGN / UPDATE                                               │
│    Admin / Agent: PUT /api/tickets/:id                           │
│                   updateTicket(id, { assigned_to: agentId })     │
│    Hook      : beforeSave auto-transitions OPEN → IN_PROGRESS   │
│                and manages resolved_at generically                │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 3. COMMENT THREAD                                                │
│    POST /api/tickets/:id/comments                                │
│    createComment(ticketId, userId, { content, is_internal })    │
│    RBAC     : is_internal comments hidden from end-users         │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 4. RESOLUTION                                                    │
│    PUT /api/tickets/:id → { status: 'RESOLVED' }                │
│    Hook     : beforeSave sets resolved_at = NOW()               │
│    Analytics: avg_resolution_hours derived from created_at→     │
│               resolved_at deltas                                │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 5. EXTERNAL INTEGRATION                                          │
│    POST /api/tickets/incoming                                    │
│    Header  : x-api-key = TICKETING_API_KEY                      │
│    Effect  : idempotent user lookup by email, ticket creation   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 9. Security Considerations

1. **Authentication**: Stateless JWT (HS256). Frontend stores tokens in memory via Zustand; no HTTP-only cookie fallback implemented.
2. **Authorization**: Role-based guards at route level (`requireAuth`, `requireAdmin`).
3. **Transport**: CORS restricts origins; HSTS enforced on Next.js edge.
4. **Data Layer**: All SQL uses parameterized queries (`$1`, `$2`) — no string concatenation.
5. **Secrets**: `.env` exists locally but is **git-ignored**; production secrets must be injected via environment.
6. **Helmet**: Security headers (CSP, X-Frame-Options, etc.) are applied on Express backend; Next.js adds additional headers via `async headers()` in config.
7. **Input Validation**: Sequelize model validators (email format, length constraints, phone regex) + route-level required-field checks.

---

## 10. Extensibility Points

- **Custom Statuses**: Admins can define arbitrary statuses via `custom_statuses` table; sort order controls inbox bucket ordering.
- **Feedback Loop**: CSAT ratings (1–5) link to tickets for service-quality analytics.
- **Knowledge Base**: `solutions` table acts as a self-service wiki; view/helpful counters enable trending/popular algorithms.
- **Extrnal Webhooks**: `incoming` endpoint allows third-party systems to push tickets without OAuth.
- **Theme System**: CSS custom properties make adding brand themes a matter of changing a few tokens without rebuilding.

---

## 11. Development Workflow

```bash
# Install workspace dependencies
npm run install:all

# Seed database from CLI
npm run db:setup

# Start dev servers concurrently
npm run dev

# Lint
npm run lint

# Production build
npm run build
```

Local database runs on Neon; no local PostgreSQL service required for development if `DATABASE_URL` points to remote instance. Docker is available for production parity but not strictly required for core dev.

---

## 12. Known Limitations & TODOs in Source

- Password reset flow is partially implemented but lacks a persistence layer (`updateUserPassword` is logged-only in `auth.ts:292-296`).
- `searchTickets` in `database-service.ts` is referenced by routes but not implemented (returns empty or throws).
- Sequelize models define associations and mixins but are not fully introspected unless explicitly loaded (the app currently relies on raw SQL views for joined data).
- Next.js 16 + React 19 is bleeding-edge; stability of concurrent features and RSC should be monitored.
