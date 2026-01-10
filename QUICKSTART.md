# WhiteCall V0 - Quick Start Guide

Get WhiteCall running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier: https://supabase.com)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

### A. Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Choose a name, password, and region
4. Wait for project to be ready (~2 minutes)

### B. Run Database Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and click "Run"
5. You should see "Success. No rows returned"

### C. Enable Realtime for Hearts

1. Go to **Database** → **Replication**
2. Find the `hearts` table
3. Toggle it **ON** for realtime
4. Click "Save"

### D. Get Your Credentials

1. Go to **Project Settings** → **API**
2. Copy your:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### E. Create `.env` File

```bash
# In project root, create .env file
cp .env.example .env
```

Edit `.env` and add your credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 3: Run the App

```bash
npm run dev
```

Open http://localhost:5173 in your browser!

## Step 4: Test the App

### Create Two Test Accounts

1. **First Browser/Tab**:
   - Sign up with email: `user1@test.com` / password: `password123`
   - Create profile: username `alice`, pick penguin + blue
   - Complete onboarding tutorial (or skip)

2. **Second Browser/Incognito**:
   - Sign up with email: `user2@test.com` / password: `password123`
   - Create profile: username `bob`, pick bear + pink
   - Complete onboarding

### Test Core Features

1. **Add Friends** (in both accounts):
   - Alice: Go to Friends → Add friend → Enter `bob`
   - Bob: Go to Friends → Add friend → Enter `alice`

2. **Toggle Call Status** (Alice's account):
   - Go to Home
   - Check "I'm on call today"

3. **Send Heart** (Bob's account):
   - Refresh Home page
   - You should see Alice in "Friends on Call Today"
   - Click "Send 🤍"
   - You should see confetti and haptic feedback!

4. **Receive Heart** (Alice's account):
   - Refresh Home page
   - You should see a heart floating around your avatar
   - Counter should show "1 white calls"
   - First heart confetti should trigger!

5. **Build Streak** (Bob's account):
   - Check the "🔥 1-day streak!" badge
   - Send another heart tomorrow to make it 2 days!

## Troubleshooting

### "Supabase credentials not found"
- Check that `.env` file exists in project root
- Restart dev server: `Ctrl+C` then `npm run dev`

### Profile not created after signup
- Go to Supabase Dashboard → SQL Editor
- Check if migration ran successfully
- Run it again if needed

### Hearts not updating in real-time
- Verify realtime is enabled for `hearts` table
- Check browser console for errors
- Try refreshing the page

### Sound not playing
- Add MP3 files to `public/sounds/` folder:
  - `heart-sent.mp3`
  - `heart-received.mp3`
  - `success.mp3`
- Or disable sound in user settings

## What to Test

- ✅ Sign up and login
- ✅ Create profile with avatar
- ✅ Onboarding tutorial
- ✅ Add friends by username
- ✅ Toggle call status
- ✅ Send hearts to friends
- ✅ Real-time heart updates
- ✅ Streak tracking
- ✅ Mobile responsive design
- ✅ Confetti celebrations
- ✅ Haptic feedback (on mobile)

## Next Steps

1. Read `README_V0.md` for full documentation
2. Check `IMPLEMENTATION_SUMMARY.md` for technical details
3. Deploy to Vercel when ready
4. Invite real users to test!

## Need Help?

- Check `WHITECALL.md` for full product vision
- Review database schema: `supabase/migrations/001_initial_schema.sql`
- TypeScript types: See `src/types/` folder

---

**You're ready to use WhiteCall! 🤍**

Send your first white call to brighten someone's shift!
