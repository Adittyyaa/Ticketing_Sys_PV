# Ticketing System

A modern, full-stack ticketing system built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- ✅ **User Authentication** - Sign up and login with Supabase Auth
- ✅ **Ticket Management** - Create, view, edit, and delete tickets
- ✅ **Advanced Filtering** - Filter by priority, status, category, and search
- ✅ **Real-time Updates** - Automatic data sync with Supabase
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **Dark Theme** - Modern slate color scheme
- ✅ **Row Level Security** - Users only see their own tickets

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Deployment**: Vercel
- **UI Components**: Lucide React Icons

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (free tier available)
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd ticketing-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Follow [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
   - Create `.env.local` with your credentials

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   - Go to `http://localhost:3000`
   - Create an account or login

### Project Structure

```
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home/redirect page
│   ├── globals.css          # Global styles
│   ├── auth/
│   │   ├── login/           # Login page
│   │   └── signup/          # Sign up page
│   └── tickets/
│       ├── page.tsx         # Ticket list
│       ├── new/page.tsx     # Create ticket
│       └── [id]/page.tsx    # Ticket details
├── components/
│   ├── Header.tsx           # Top navigation
│   ├── FilterBar.tsx        # Search & filter
│   └── TicketTable.tsx      # Ticket list display
├── lib/
│   ├── supabase.ts          # Supabase client
│   ├── types.ts             # TypeScript types
│   └── store.ts             # Zustand stores
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## Features Explained

### Tickets
- **Number**: Auto-incrementing ticket ID
- **Title**: Brief summary
- **Description**: Detailed issue description
- **Category**: Bug Report, Technical Issue, Account Inquiry, New Feature Request, Other
- **Priority**: LOW, MEDIUM, HIGH, URGENT
- **Status**: UNTOUCHED, PENDING, OPENED, SOLVED
- **Tags**: Custom tags for organization
- **Dates**: Created and updated timestamps

### User Flow

1. **Sign Up** - Create account with email/password
2. **Login** - Access your tickets dashboard
3. **Create Ticket** - Click "Add ticket" button
4. **View Details** - Click on ticket to see full details
5. **Edit** - Update priority, status, or other fields
6. **Delete** - Remove ticket (with confirmation)
7. **Filter** - Search and filter tickets by various criteria

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step Vercel deployment guide.

## Database Schema

### tickets table
- `id` (UUID) - Primary key
- `number` (SERIAL) - Auto-increment ticket number
- `user_id` (UUID) - Foreign key to auth.users
- `title` (VARCHAR) - Ticket title
- `description` (TEXT) - Full description
- `category` (VARCHAR) - Ticket category
- `priority` (VARCHAR) - Priority level
- `status` (VARCHAR) - Current status
- `tags` (TEXT[]) - Array of tags
- `assigned_to` (UUID) - Optional assignee
- `created_at` (TIMESTAMP) - Creation date
- `updated_at` (TIMESTAMP) - Last update date

### Row Level Security (RLS)
- Users can only view their own tickets
- Users can only edit their own tickets
- Users can only delete their own tickets

## API Routes

All data is managed through Supabase. No custom API routes needed.

### Supabase Queries

- **Fetch tickets**: `SELECT * FROM tickets WHERE user_id = ?`
- **Create ticket**: `INSERT INTO tickets VALUES (...)`
- **Update ticket**: `UPDATE tickets SET ... WHERE id = ?`
- **Delete ticket**: `DELETE FROM tickets WHERE id = ?`

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Performance Tips

- Tickets are indexed by `user_id`, `status`, and `priority` for fast queries
- Images are lazy-loaded with Next.js Image optimization
- CSS is optimized with Tailwind's tree-shaking
- Bundle size is kept minimal with selective imports

## Security

- ✅ Supabase Auth handles password hashing
- ✅ Row Level Security (RLS) enforces user isolation
- ✅ Environment variables keep secrets safe
- ✅ HTTPS only (enforced by Vercel/Supabase)
- ✅ No sensitive data in client code

## Troubleshooting

### Can't login?
- Check Supabase credentials in `.env.local`
- Verify email in Supabase Auth settings
- Check RLS policies are enabled

### Tickets not showing?
- Verify user authentication
- Check browser console for errors
- Ensure RLS policies allow READ access

### Deployment issues?
- Clear Vercel cache and redeploy
- Check environment variables in Vercel dashboard
- Review Vercel build logs

## Future Enhancements

- [ ] Team/admin dashboard
- [ ] Email notifications
- [ ] Comment system on tickets
- [ ] File attachments
- [ ] Advanced analytics
- [ ] Ticket templates
- [ ] Assignment system
- [ ] Bulk operations
- [ ] Export/import functionality
- [ ] Mobile app

## License

MIT

## Support

For issues or questions:
1. Check the docs
2. Review existing GitHub issues
3. Create a new issue with details

---

Built with ❤️ using Next.js, Supabase, and Vercel
