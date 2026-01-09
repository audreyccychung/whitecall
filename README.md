# Shift Calendar

A modern scheduling application designed specifically for healthcare workers to manage complex shift schedules, sync with personal calendars, and coordinate availability with friends and family.

## 🎯 Problem We're Solving

Healthcare workers (doctors, nurses, PAs) work irregular hours with shifts ranging from 8 to 34 hours. Existing scheduling apps like MyDuty have critical limitations:
- Cannot handle shifts spanning multiple days (e.g., 8:30 AM Monday → 6 PM Tuesday)
- No automatic calendar synchronization (must maintain duplicate schedules)
- No intelligent group availability finder

Shift Calendar solves all of these problems.

## ✨ Core Features

### MVP (Version 0.1)
- **Multi-day shift support**: Create shifts from 8 to 34 hours that automatically span multiple days
- **Shift templates**: Pre-configure common shift types with custom start times
- **Monthly calendar view**: Quick-tap interface to add shifts (preserving the best UX from MyDuty)
- **Group scheduling**: Create groups to view colleagues' schedules in a clean weekly block format
- **Smart availability finder**:
  - Find times when X out of Y group members are free
  - Filter by time of day and minimum duration needed
  - Shows results with availability counts (e.g., "3/5 free")
- **Statistics tracking**:
  - Total hours worked per month
  - Number of call shifts (24+ hour shifts)
  - Simple visualizations
- **Calendar sync** (Premium): Two-way sync with Google Calendar and Apple Calendar
- **iCal feed generation**: Share your schedule with family members who can subscribe

### Freemium Model
**Free Tier:**
- Up to 5 shift templates
- Up to 3 groups
- Up to 10 members per group
- Basic statistics

**Premium ($4.99/month or $49/year):**
- Calendar sync (Google + Apple)
- iCal feed generation for family sharing
- Unlimited shift templates
- Unlimited groups
- Up to 99 members per group
- Advanced statistics

## 🛠️ Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite (for fast development and builds)
- **Styling**: Tailwind CSS (mobile-first, responsive design)
- **Routing**: React Router v6
- **Backend**: Supabase
  - PostgreSQL database
  - Authentication (email, Google, Apple)
  - Real-time subscriptions
  - Row-level security
- **Date Handling**: date-fns
- **Form Management**: react-hook-form
- **State Management**: Zustand (simpler than Redux)
- **Deployment**: Vercel (frontend) + Supabase (backend)

## 📁 Project Structure

```
shift-calendar/
├── src/
│   ├── pages/              # Full page components (LoginPage, CalendarPage, etc.)
│   ├── components/         # Reusable UI components (Button, Modal, etc.)
│   ├── hooks/              # Custom React hooks (useAuth, useShifts, etc.)
│   ├── services/           # API calls and business logic (authService, shiftService)
│   ├── utils/              # Helper functions (date formatting, validation)
│   ├── types/              # TypeScript type definitions
│   ├── contexts/           # React context for global state
│   ├── App.tsx             # Main app component with routing
│   └── main.tsx            # Application entry point
├── public/                 # Static assets (images, icons)
├── supabase/               # Database migrations and schema
├── README.md               # This file
├── CLAUDE.md               # Development context for AI assistance
├── CHANGELOG.md            # Version history
└── ...config files
```

## 🚀 Getting Started

### Prerequisites
- Node.js v20 or higher
- npm or yarn
- Supabase account (free tier works for development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/shift-calendar.git
cd shift-calendar
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

## 🗄️ Database Schema

### Key Tables
- `users`: User profiles (linked to Supabase auth)
- `shift_templates`: User-defined shift types (e.g., "Day Shift", "Call")
- `shifts`: Individual shift instances on the calendar
- `groups`: User-created groups for schedule sharing
- `group_members`: Membership relationships
- `availability_requests`: Cached availability searches (performance optimization)

See `supabase/migrations/` for detailed schema definitions.

## 📱 Key Design Decisions

1. **Web-first, then native apps**: Starting with a Progressive Web App (PWA) to validate product-market fit before investing in native iOS/Android apps
2. **Calendar sync as premium feature**: The core value-add that justifies premium pricing
3. **Mobile-first design**: Healthcare workers primarily use phones, so all UI is mobile-optimized
4. **Simple freemium tiers**: Clear feature differentiation to drive conversions
5. **No shift swapping in MVP**: Focusing on personal scheduling and group coordination first
6. **Supabase over Firebase**: Better developer experience, PostgreSQL, and built-in auth

## 🎯 Competitive Advantages

| Feature | MyDuty | NurseGrid | Amion | Shift Calendar |
|---------|---------|-----------|-------|----------------|
| Multi-day shifts | ❌ | ✅ | ✅ | ✅ |
| Calendar sync | ❌ | ✅ (buggy) | ✅ | ✅ |
| Group availability finder | ❌ | ❌ | ❌ | ✅ |
| All healthcare workers | ✅ | Nurse-focused | Enterprise | ✅ |
| Family sharing | ❌ | ✅ | ❌ | ✅ |
| Price | $2.99/mo | Free + ads | $449/yr | Free + $4.99/mo |

## 🧪 Development Workflow

1. **Feature planning**: Use CLAUDE.md to plan features before coding
2. **Development**: Use Claude Code to build features iteratively
3. **Testing**: Manual testing in browser (automated tests added later)
4. **Commit**: Frequent, descriptive commits
5. **Deploy**: Push to GitHub → Vercel auto-deploys

## 🤝 Contributing

This is currently a solo project. Contributions may be accepted in the future.

## 📄 License

[To be determined - likely MIT or proprietary depending on commercialization plans]

## 📧 Contact

[Your contact information when ready to share]

## 🗺️ Roadmap

**Phase 1 (Months 1-3)**: MVP Development
- ✅ Project setup
- ⏳ Authentication
- ⏳ Calendar view with shift management
- ⏳ Groups and group calendar view
- ⏳ Availability finder
- ⏳ Basic statistics

**Phase 2 (Months 4-6)**: Polish and Beta
- Calendar sync (Google/Apple)
- iCal feed generation
- Payment integration (Stripe)
- Beta testing with 20-50 healthcare workers
- Bug fixes and UX improvements

**Phase 3 (Months 7-12)**: Launch and Growth
- Public launch
- Marketing to healthcare communities
- Analytics and monitoring
- Feature improvements based on feedback
- Consider native mobile apps

**Future Features (Post-MVP)**:
- Shift swapping within groups
- Push notifications

---

Built with ❤️ for healthcare workers who deserve better scheduling tools.
