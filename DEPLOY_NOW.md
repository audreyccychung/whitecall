# Deploy WhiteCall V0 - Quick Guide

## ⚠️ IMPORTANT: Complete These Steps Before Deploying

### Step 1: Verify Supabase API Key (REQUIRED)

You provided:
- URL: `https://uerolgdehjywyjlfqymx.supabase.co` ✅
- Key: `sb_publishable_6N5namgJ3dc2gkux0JHhlA_Z8dRyTQ1` ⚠️

**The key format doesn't look correct.** Supabase anon keys are usually long JWT tokens starting with `eyJ`.

**Please verify:**
1. Go to your Supabase project: https://app.supabase.com/project/uerolgdehjywyjlfqymx
2. Navigate to: Settings → API
3. Copy the **`anon` `public`** key (it should be a very long token)
4. Update `.env` file with the correct key

### Step 2: Run Database Migration (REQUIRED)

Your database needs tables before the app will work!

1. Go to: https://app.supabase.com/project/uerolgdehjywyjlfqymx/sql
2. Click "New Query"
3. Copy the entire contents of: `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click "Run" (or press Cmd+Enter)
6. Verify it says "Success" with no errors

**What this creates:**
- 5 tables (profiles, friendships, hearts, user_settings, user_badges)
- Row-level security policies
- Database triggers for streaks
- Indexes for performance

### Step 3: Test Locally (RECOMMENDED)

Before deploying to Vercel, test locally:

```bash
cd /Users/audrey/Desktop/claude_projects/Projects/whitecall

# Make sure .env has correct Supabase credentials
# Edit .env if needed

# Start dev server
npm run dev

# Visit http://localhost:5173
# Try signing up and creating a profile
```

**What to test:**
- ✅ Sign up with email/password
- ✅ Create profile with avatar
- ✅ Navigate to Friends page
- ✅ Check for console errors

### Step 4: Deploy to Vercel

Once local testing works:

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "WhiteCall V0 - initial deployment"

# Create GitHub repo and push
# (or push to existing repo)
git remote add origin <your-github-repo-url>
git push -u origin main
```

**Then deploy to Vercel:**

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. **Add environment variables:**
   - `VITE_SUPABASE_URL` = `https://uerolgdehjywyjlfqymx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `<your-correct-anon-key>`
5. Click "Deploy"

**Vercel will automatically:**
- Detect it's a Vite project
- Run `npm run build`
- Deploy to a `.vercel.app` URL

---

## Current Status

- ✅ **Code**: WhiteCall V0 complete (40+ files)
- ✅ **Build**: Production build successful (176KB gzipped)
- ✅ **Database Schema**: Ready in `supabase/migrations/001_initial_schema.sql`
- ⏳ **Supabase**: Need to verify API key
- ⏳ **Supabase**: Need to run migration
- ⏳ **Vercel**: Ready to deploy after above steps

---

## Troubleshooting

### "Failed to fetch" errors
- Check that Supabase URL and key are correct in `.env`
- Verify database migration ran successfully
- Check browser console for specific errors

### "Relation does not exist" errors
- You forgot to run the database migration
- Go to Supabase SQL editor and run the migration

### Authentication not working
- Verify anon key is correct
- Check Supabase project → Authentication → Providers
- Make sure email auth is enabled

### Hearts not appearing
- Check real-time subscriptions are enabled in Supabase
- Check browser console for errors
- Verify friends exist and are marked as "on call"

---

## Quick Commands

```bash
# Local development
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Type check
npx tsc --noEmit
```

---

## What Happens After Deployment

1. **Share the URL** with beta testers
2. **Monitor for bugs** - check Vercel logs and browser console
3. **Gather feedback** - ask users about UX, features
4. **Track metrics**:
   - Daily active users
   - Hearts sent per day
   - Streak engagement
   - Time to first heart sent

---

## Next Steps After V0 Launch

Once deployed and tested:

1. **V0.5 Planning** (Week 3-4)
   - Calendar integration
   - Automatic call detection
   - Message feed

2. **Retention Analysis**
   - Are streaks working?
   - Is onboarding effective?
   - What's the D1/D7 retention?

3. **Beta Feedback**
   - What features are missing?
   - Any UX confusion?
   - Performance issues?

---

**Ready to launch!** 🚀

Just need to:
1. ✅ Verify/update Supabase anon key
2. ✅ Run database migration
3. ✅ Deploy to Vercel

Questions? Check the other docs:
- `README_V0.md` - Full setup guide
- `QUICKSTART.md` - 5-minute quick start
- `V0_COMPLETION_SUMMARY.md` - Complete build summary
