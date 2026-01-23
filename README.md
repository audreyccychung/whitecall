# WhiteCall V0 - Setup & Running Guide

**Version**: 0.0.1 (V0 - Proof of Concept)
**Last Updated**: 2026-01-10

## What is WhiteCall?

WhiteCall is an emotional support app for healthcare workers facing call shifts. "White call" is Hong Kong medical slang for a peaceful call shift. When colleagues are on call, you can send them white hearts 🤍 as encouragement.

## V0 Features Implemented

### Core Features
- ✅ User authentication (email/password via Supabase)
- ✅ Avatar creation (8 animals × 6 colors)
- ✅ Profile creation with username
- ✅ Friends system (add by username, bidirectional)
- ✅ "I'm on call today" toggle
- ✅ Send hearts to friends on call (one per day per friend)
- ✅ Real-time heart updates
- ✅ Hearts displayed around avatar with animations

### Retention Features
- ✅ Daily streaks tracking
- ✅ Streak display (🔥 X-day streak!)
- ✅ Onboarding tutorial modal with confetti
- ✅ Haptic feedback (mobile vibration)
- ✅ Sound feedback (optional, user can toggle)
- ✅ Heart counter animation
- ✅ Confetti on first heart received
- ✅ User settings (sound, haptic, notifications)

### UI/UX
- ✅ Mobile-first responsive design
- ✅ Professional cute aesthetic
- ✅ Framer Motion animations
- ✅ Loading states
- ✅ Empty states
- ✅ Error handling
- ✅ Protected routes

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier is fine)
- Modern browser

### 2. Supabase Setup

1. **Create a Supabase project** at https://supabase.com

2. **Run the database migration**:
   - Go to Supabase Dashboard → SQL Editor
   - Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
   - Run the SQL

3. **Get your credentials**:
   - Go to Project Settings → API
   - Copy your Project URL and Anon/Public Key

4. **Create `.env` file**:
   ```bash
   cp .env.example .env
   ```

5. **Add your Supabase credentials to `.env`**:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

App will be available at http://localhost:5173

### 5. (Optional) Add Sound Files

For full experience, add these sound files to `public/sounds/`:
- `heart-sent.mp3`
- `heart-received.mp3`
- `success.mp3`

See `public/sounds/README.md` for recommendations.

## Usage Flow

### New User Flow

1. **Sign Up** (`/signup`)
   - Enter email and password
   - Password must be 8+ characters

2. **Create Profile** (`/create-profile`)
   - Choose an animal avatar (penguin, bear, cat, dog, rabbit, fox, owl, panda)
   - Pick a color (pink, blue, purple, green, yellow, peach)
   - Set username (lowercase, 3-20 chars, letters/numbers/underscores)
   - Optional: Set display name

3. **Onboarding Tutorial** (shown once)
   - 4-step walkthrough
   - Can skip or go through
   - Confetti celebration on completion

4. **Home Page** (`/home`)
   - See your avatar with hearts received
   - Toggle "I'm on call today"
   - View friends on call
   - Send hearts to friends
   - Track your streak

5. **Add Friends** (`/friends`)
   - Search by username
   - Add friends
   - View all friends
   - See who's on call

### Daily Usage Flow

1. Toggle "I'm on call today" if on call
2. Check which friends are on call
3. Send hearts to support them
4. Build your streak by sending daily
5. Receive hearts when you're on call

## Key Features Explained

### Streaks
- Send at least one heart per day to maintain streak
- Database automatically tracks consecutive days
- Displayed prominently on home page
- "🔥 X-day streak!" badge

### Hearts
- Can only send to friends who are on call
- One heart per friend per day (enforced by database)
- Real-time updates when received
- Displayed around avatar with floating animation
- Counter shows total hearts received today

### Onboarding
- Shows once on first login
- Explains how to use WhiteCall
- Tracks completion in database
- Skippable

### Settings
- Sound on/off
- Haptic feedback on/off
- Notifications on/off (future feature)
- Accessible from profile (future)

## Database Schema Overview

### Tables
- `profiles` - User profiles with avatar and streak data
- `friendships` - Bidirectional friend relationships
- `hearts` - Hearts sent between users
- `user_settings` - User preferences
- `user_badges` - Milestone badges (for V0.5+)

### Key Database Features
- Row-level security (RLS) for privacy
- Automatic triggers for streak updates
- Unique constraints prevent duplicate hearts
- Real-time subscriptions for live updates

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Backend**: Supabase (Auth + PostgreSQL + Realtime)
- **State**: Zustand
- **Routing**: React Router v6
- **Confetti**: canvas-confetti

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── AvatarDisplay.tsx
│   ├── AvatarSelector.tsx
│   ├── HeartDisplay.tsx
│   ├── HeartButton.tsx
│   ├── StreakDisplay.tsx
│   ├── OnboardingModal.tsx
│   ├── FriendsList.tsx
│   ├── AddFriendForm.tsx
│   └── ...
├── contexts/          # React contexts
│   └── AuthContext.tsx
├── hooks/             # Custom React hooks
│   ├── useFriends.ts
│   ├── useHearts.ts
│   ├── useCallStatus.ts
│   └── useSettings.ts
├── lib/               # Core libraries
│   ├── supabase.ts
│   └── store.ts       # Zustand store
├── pages/             # Page components
│   ├── LoginPage.tsx
│   ├── SignUpPage.tsx
│   ├── CreateProfilePage.tsx
│   ├── HomePage.tsx
│   └── FriendsPage.tsx
├── types/             # TypeScript types
│   ├── database.ts
│   ├── avatar.ts
│   ├── friend.ts
│   ├── heart.ts
│   └── auth.ts
├── utils/             # Utility functions
│   ├── confetti.ts
│   ├── feedback.ts    # Haptic & sound
│   └── date.ts
└── App.tsx            # Main app with routing
```

## Common Issues & Solutions

### "Supabase credentials not found"
- Make sure `.env` file exists in project root
- Check that variables start with `VITE_`
- Restart dev server after creating `.env`

### Profile not created after signup
- Check SQL migration ran successfully
- Look for errors in browser console
- Verify RLS policies are enabled

### Hearts not updating in real-time
- Check Supabase realtime is enabled for `hearts` table
- Go to Database → Replication → Enable for `hearts`

### Sound not playing
- User must interact with page first (browser requirement)
- Check sound files exist in `public/sounds/`
- Check console for errors

### Haptic feedback not working
- Only works on mobile devices with vibration support
- Check browser permissions
- iOS Safari requires user gesture first

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run lint
```

## Database Migrations

**DO NOT modify the database schema via the Supabase dashboard.**

All schema changes must go through migrations to prevent drift between local and remote.

### Migration Commands

```bash
# Check migration folder exists
npm run db:check

# View migration sync status (local vs remote)
npm run db:status

# Create a new migration
npm run db:new your_change_name

# Push migrations to remote
npm run db:push
```

### Migration Workflow

1. Create migration: `npm run db:new add_feature_name`
2. Edit the generated file in `supabase/migrations/`
3. Push to remote: `npm run db:push`
4. Commit: `git add supabase/migrations/ && git commit`

### Rules

- **CLI for schema changes** (tables, columns, RLS, functions)
- **Dashboard for read-only ops** (viewing data, debugging queries)
- Never edit a pushed migration—create a new one
- Migrations are append-only, like git commits

## Next Steps (V0.5)

- [ ] Calendar integration
- [ ] Automatic call shift detection
- [ ] Message feed (see who sent hearts)
- [ ] Weekly recap
- [ ] Smart feed prioritization
- [ ] Badge system

## Testing Checklist

### Manual Testing
- [ ] Sign up new user
- [ ] Create profile
- [ ] Complete onboarding
- [ ] Toggle call status
- [ ] Add friend by username
- [ ] Send heart to friend on call
- [ ] Receive heart (test with 2 accounts)
- [ ] Build streak (send hearts on consecutive days)
- [ ] Test on mobile (320px width)
- [ ] Test on tablet (768px)
- [ ] Test on desktop (1024px+)

### Edge Cases
- [ ] Try to send heart twice to same friend
- [ ] Add non-existent username
- [ ] Add yourself as friend
- [ ] Send heart to friend not on call
- [ ] Username with invalid characters

## Known Limitations (V0)

- No calendar - users manually toggle call status
- No groups yet
- No profile editing (username is permanent)
- No password reset
- No push notifications
- No analytics dashboard
- Sounds require manual setup

## Support & Resources

- **Spec**: See `WHITECALL.md` for full product vision
- **Database Schema**: See `supabase/migrations/001_initial_schema.sql`
- **Supabase Docs**: https://supabase.com/docs
- **React Docs**: https://react.dev
- **Tailwind Docs**: https://tailwindcss.com
- **Framer Motion**: https://www.framer.com/motion/

## License

[Add your license here]

---

**Built with ❤️ for healthcare workers who need support during call shifts.**

🤍 Let's make call shifts a little less lonely.
