# WhiteCall

Emotional support app for healthcare workers on call shifts.

**Live**: [whitecall.vercel.app](https://whitecall.vercel.app)

---

## Quick Start

```bash
npm install
npm run dev
```

App runs at http://localhost:5173

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:push` | Push migrations to Supabase |
| `npm run db:status` | Check migration status |

---

## Documentation

| Doc | Purpose |
|-----|---------|
| `CLAUDE.md` | Development rules for Claude Code |
| `ROADMAP.md` | Version history & upcoming features |
| `CHANGELOG.md` | Detailed change log |
| `docs/SECRETS.md` | All API keys & env vars (gitignored) |
| `docs/CODING_STANDARDS.md` | Code conventions |

---

## Project Structure

```
src/
├── components/     # UI components
├── hooks/          # React hooks (data fetching)
├── pages/          # Route pages
├── types/          # TypeScript types
├── utils/          # Utilities
└── lib/            # Supabase client, store

api/                # Vercel serverless functions
├── daily-notifications.ts   # Cron: 10 AM HKT
├── streak-reminder.ts       # Cron: 5:30 PM HKT
└── lib/                     # Shared API utilities

supabase/
├── migrations/     # Database schema (numbered SQL files)
└── functions/      # Edge functions (push notifications)
```

---

## Environment Setup

### Local (`.env`)
```
VITE_SUPABASE_URL=https://uerolgdehjywyjlfqymx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

### Production (Vercel)
See `docs/SECRETS.md` for complete list of environment variables.

---

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind
- **Backend**: Supabase (Auth, PostgreSQL, Edge Functions)
- **Deploy**: Vercel (frontend + cron jobs)
- **State**: Zustand
- **Animations**: Framer Motion

---

*Built with 🤍 for healthcare workers everywhere.*
