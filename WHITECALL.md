# WhiteCall - Social Support for Healthcare Workers

**Last Updated**: 2026-01-10 (with Retention Strategy)
**Project**: WhiteCall (formerly Shift Calendar)
**Status**: Planning Phase with Enhanced Retention Features

---

## 🎯 VISION

### What is "White Call"?
In Hong Kong medical culture, "white call" (白鐘) is a phrase of encouragement meaning a peaceful call shift where the doctor isn't busy and gets to sleep. It's what every healthcare worker hopes for when facing a 24-34 hour shift.

### The Problem
Healthcare workers face brutal call shifts alone. Existing apps are purely functional (schedule management) but miss the **emotional support** aspect. Call shifts are isolating and stressful.

### Our Solution
**WhiteCall** transforms call shifts from lonely experiences into moments of community support. When you're on call, your friends can send you white hearts 🤍 as encouragement. See your cute avatar surrounded by hearts from colleagues who care.

---

## 🌟 CORE FEATURES BY VERSION

### V0 - Proof of Concept (Week 1-2)
**Goal**: Validate the social support mechanic + establish retention hooks

**Core Features**:
- User creates cute avatar (e.g., penguin character)
- Manual "I'm on call today!" checkbox
- Users can connect with other users (friends/colleagues)
- Send white hearts 🤍 to friends on call
- Hearts appear around recipient's avatar
- Simple, clean UI focused on the heart-sending experience

**🎯 RETENTION FEATURES (CRITICAL - Add to V0)**:
1. **Daily Streaks** (2-3 hours)
   - Track consecutive days user sends hearts
   - Display "🔥 7-day streak!" prominently on home screen
   - Increases DAU by 25-35% (proven by Duolingo/Snapchat)

2. **Onboarding Tutorial** (4-5 hours)
   - Guide first-time users: "Let's send your first white call! 🤍"
   - Celebration with confetti when first heart is sent
   - Prompt to add 3+ friends
   - Improves Day 1 retention by 40%

3. **Haptic & Sound Feedback** (1-2 hours)
   - Gentle vibration when sending/receiving hearts (mobile)
   - Optional soft sound effect (user can toggle)
   - Emotional reinforcement = higher perceived value

**Quick Wins** (1-2 hours each, add anytime):
- Heart counter with bounce animation
- Confetti on first heart received
- Empty state: "Enjoy the quiet day! 😌" when no friends on call
- Rare gold hearts (10% chance)

**Scope**:
- No calendar integration yet
- No group spaces
- Basic auth (email/password)
- Static avatars (no movement initially)
- Web-only (mobile-responsive)

### V0.5 - Calendar Integration (Week 3-4)
**Goal**: Automate call shift detection and streamline support sending

**Core Features**:
- Calendar function: Users input their shifts
- App automatically knows who's on call
- "Friends on call today" feed/list
- One-by-one heart sending (click each friend individually)
- Notification-style message feed: "Audrey wishes you a white call! 🤍"
- Messages stack like a chat but are read-only (no replies)
- See who sent you hearts

**🎯 RETENTION FEATURES (High Impact)**:
1. **Weekly Recap** (2 days)
   - Sunday evening: "You sent 23 hearts this week 🤍"
   - Shareable Instagram story format
   - Social proof + viral loop

2. **"Who Needs Support Most" Smart Feed** (1 day)
   - Prioritize friends with 3+ call shifts who haven't received many hearts
   - Label: "🆘 Dave has 4 call shifts this week - send support!"
   - Guides users to meaningful actions

3. **"You Made Someone's Day" Feedback** (0.5 days)
   - When someone receives 5+ hearts, notify a random sender
   - "Your heart made Alice's shift brighter! She got 12 hearts today 🤍"
   - Creates positive reinforcement loop

**Key UX Decision**:
- **NO "Send to All" button** - Users must click each friend individually
- **Why**: Makes support feel personal and intentional, not automated
- Creates a moment of connection for each person

### V1 - Group Spaces (Week 5-8)
**Goal**: Create shared virtual spaces for teams/friend groups

**Core Features**:
- Create and join groups
- Each group has a shared environment:
  - Grassy field option
  - Snowy playground option
  - Other cute/cozy environments
- Avatars "hangout" in this space
- Avatars change color based on status:
  - **Light blue**: Not on call
  - **White**: On call today
- Username label above avatar: "Audrey is on call today"
- Click any avatar to send 🤍
- Avatars have simple idle animations (gentle bobbing, breathing)

**🎯 RETENTION FEATURES**:
1. **Milestone Badges** (2 days)
   - Supporter badges: "First Heart", "Caring Colleague" (10), "Support Squad" (50), "Champion" (100)
   - Survivor badges: "First Call", "Call Warrior" (10), "Shift Legend" (50)
   - Display on profile and in group spaces
   - Gamification increases long-term retention 15-20%

2. **Group Leaderboards** (1 day)
   - "Top Supporter This Week" (most hearts sent)
   - "Most Supported" (most hearts received)
   - "Shift MVP" (most hours worked)
   - Friendly competition (no shaming, just celebration)
   - Drives 30% more engagement

**Stretch Goals (V1.1)**:
- Avatar wandering/movement in the space
- Seasonal environment changes
- Custom group environments

### Post-V1 Features (V2 - Future)
**Premium Features**:
- Calendar sync (Google/Apple) - **Main premium driver**
- Group availability finder
- Advanced statistics dashboard
- Premium avatar accessories ($0.99-$2.99)
- Custom group environments ($4.99 per group)

**Community Features**:
- Anonymous "Call Survival Stories" feed
  - Users share call shift stories (optional, anonymous)
  - Prompts: "What got you through?" "Funniest moment?"
  - Read-only, react with hearts/emojis
  - Creates emotional connection, increases session time

- Family Mode
  - Simplified interface for non-medical family members
  - Family can see when loved one is on call (with permission)
  - Send hearts with custom messages
  - Unique differentiator, expands user base

**Infrastructure**:
- Push notifications (strategic, never spammy)
- Native app (iOS/Android)
- Hospital white-label partnerships ($49/mo)

---

## 🎨 DESIGN PHILOSOPHY

### Visual Style
**"Professional Cute"** - Cute enough to feel supportive, professional enough for doctors

- **Color Palette**:
  - Primary: Soft whites, light blues (call shift association)
  - Accent: Warm pastels (pink, lavender, mint)
  - Dark mode friendly
- **Typography**: Rounded sans-serif, readable, friendly
- **Animations**: Gentle, smooth, not distracting
- **Icons**: Rounded, simple, consistent

### Avatar Design
- **Style**: Simple, cute, recognizable
- **Options**: Penguin, bear, cat, dog, rabbit, etc.
- **Customization**: Color variations, accessories (optional V2)
- **Size**: Large enough to see hearts around them clearly
- **Animation**: Subtle breathing/idle movement

### Heart Mechanics
- **Appearance**: White hearts 🤍 float around avatar
- **Animation**: Gentle floating, pulsing, maybe sparkle
- **Accumulation**: Multiple hearts stack/orbit around avatar
- **Persistence**: Hearts stay visible for the call shift duration
- **Counter**: Show total hearts received

---

## 🏗️ TECHNICAL ARCHITECTURE

### Tech Stack

**Frontend**:
- **React 18 + TypeScript** - Type safety, component reusability
- **Vite** - Fast dev environment
- **Tailwind CSS** - Mobile-first responsive design
- **Framer Motion** - Smooth animations for hearts and avatars
- **React Router v6** - Navigation

**Backend**:
- **Supabase** - Auth, PostgreSQL, real-time subscriptions
- **Row-Level Security** - Privacy and data protection

**State Management**:
- **Zustand** - Global state (user, friends, call status)
- **React Query** - Server state caching (optional for V0.5+)

**Deployment**:
- **Vercel** - Frontend hosting with auto-deploy
- **Supabase Cloud** - Backend

### Why These Choices?

**React + TypeScript**:
- Strong ecosystem for building complex UIs
- Type safety catches bugs early
- Easy to refactor as features evolve

**Supabase over Firebase**:
- PostgreSQL > Firestore for relational data (friends, groups)
- Better DX, built-in auth
- Real-time subscriptions for live heart updates
- Free tier sufficient for MVP

**Framer Motion**:
- Best-in-class animations for React
- Performant, smooth on mobile
- Easy to create floating heart effects

**Zustand over Redux**:
- Simpler, less boilerplate
- Sufficient for app complexity
- Easy to learn and maintain

---

## 📊 DATABASE SCHEMA

### V0 Schema

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_type TEXT NOT NULL, -- 'penguin', 'bear', etc.
  avatar_color TEXT, -- hex color for customization
  is_on_call BOOLEAN DEFAULT FALSE,
  -- RETENTION: Streak tracking
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_heart_sent_date DATE,
  -- RETENTION: Onboarding
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Friendships (bidirectional)
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Hearts sent
CREATE TABLE hearts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT DEFAULT 'wishes you a white call!',
  created_at TIMESTAMP DEFAULT NOW(),
  shift_date DATE NOT NULL -- which day this heart is for
);

-- RETENTION: User settings
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id),
  sound_enabled BOOLEAN DEFAULT TRUE,
  haptic_enabled BOOLEAN DEFAULT TRUE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RETENTION: Badges (V0.5+)
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL, -- 'first_heart', 'caring_colleague', etc.
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- Index for performance
CREATE INDEX idx_hearts_recipient_date ON hearts(recipient_id, shift_date);
CREATE INDEX idx_friendships_user ON friendships(user_id);
```

### V0.5 Schema Additions

```sql
-- Shift templates
CREATE TABLE shift_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT, -- hex color
  default_start_time TIME,
  default_duration_hours INTEGER,
  is_call_shift BOOLEAN DEFAULT FALSE, -- marks if this is a call shift
  created_at TIMESTAMP DEFAULT NOW()
);

-- Shifts
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES shift_templates(id),
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  is_call_shift BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for finding who's on call
CREATE INDEX idx_shifts_user_dates ON shifts(user_id, start_datetime, end_datetime);

-- View for current call status (updated automatically)
CREATE VIEW users_on_call_today AS
SELECT DISTINCT user_id
FROM shifts
WHERE is_call_shift = TRUE
  AND start_datetime::date <= CURRENT_DATE
  AND end_datetime::date >= CURRENT_DATE;
```

### V1 Schema Additions

```sql
-- Groups
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  environment_type TEXT DEFAULT 'grassy_field', -- 'grassy_field', 'snowy_playground'
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Group members
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'admin' or 'member'
  position_x FLOAT, -- avatar position in group space
  position_y FLOAT,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);
```

---

## 🛠️ IMPLEMENTATION PLAN

### Phase 1: V0 Core (Week 1-2)

**Goal**: Prove the social support mechanic works and feels good

#### Step 1: Project Setup (Day 1)
- [ ] Initialize Vite + React + TypeScript
- [ ] Configure Tailwind CSS
- [ ] Set up Supabase project
- [ ] Configure environment variables
- [ ] Create basic folder structure

#### Step 2: Authentication (Day 2)
- [ ] Email/password auth with Supabase
- [ ] Login and signup pages
- [ ] Auth context/state management
- [ ] Protected routes

#### Step 3: Profile & Avatar (Day 3-4)
- [ ] Create profile after signup
- [ ] Avatar selection interface (choose animal type)
- [ ] Avatar display component
- [ ] Profile page

#### Step 4: Friends System (Day 5-6)
- [ ] Friend request system (or simple add by username)
- [ ] Friends list page
- [ ] Search/add friends interface

#### Step 5: Call Status & Hearts (Day 7-9)
- [ ] "I'm on call today" checkbox
- [ ] Friend feed showing who's on call
- [ ] Send heart button
- [ ] Heart animation around avatar
- [ ] Heart counter
- [ ] Real-time updates (Supabase subscriptions)

#### Step 6: Retention Features (Day 10-11)
- [ ] Daily streaks system (database + UI)
- [ ] Onboarding tutorial modal
- [ ] Haptic & sound feedback
- [ ] Heart counter animation
- [ ] Confetti on first heart

#### Step 7: Polish & Testing (Day 12-14)
- [ ] Mobile responsive design
- [ ] Error handling
- [ ] Loading states
- [ ] Basic animations
- [ ] Manual testing
- [ ] Bug fixes

**Deliverable**: Working demo with proven retention hooks that keep users coming back

### Phase 2: V0.5 Calendar Integration (Week 3-4)

#### Step 1: Shift Templates (Day 1-2)
- [ ] Create shift template interface
- [ ] Template management (CRUD)
- [ ] Mark templates as "call shifts"

#### Step 2: Calendar View (Day 3-5)
- [ ] Monthly calendar component
- [ ] Add/edit/delete shifts
- [ ] Multi-day shift support
- [ ] Visual indicators for call shifts

#### Step 3: Automatic Call Detection (Day 6-7)
- [ ] Remove manual checkbox
- [ ] Auto-detect call shifts from calendar
- [ ] Update "Friends on call today" feed
- [ ] Database view for efficient queries

#### Step 4: Message Feed (Day 8-10)
- [ ] Chat-like message component
- [ ] "X wishes you a white call! 🤍" format
- [ ] Stack messages chronologically
- [ ] No reply functionality (read-only)
- [ ] See who sent hearts

#### Step 5: Retention Features (Day 11-13)
- [ ] Weekly recap screen with shareable image
- [ ] Smart feed: prioritize friends who need support
- [ ] "You made someone's day" feedback system
- [ ] Badge system foundation

#### Step 6: Testing & Refinement (Day 14-15)
- [ ] Test calendar with various shift patterns
- [ ] Test auto-detection accuracy
- [ ] Test retention features with beta users
- [ ] Mobile testing
- [ ] Performance optimization

**Deliverable**: Calendar + retention features that drive Week 2-4 engagement

### Phase 3: V1 Group Spaces (Week 5-8)

#### Step 1: Group Management (Week 5)
- [ ] Create group interface
- [ ] Group settings (name, environment)
- [ ] Invite members
- [ ] Join/leave groups
- [ ] Group list page

#### Step 2: Environment Rendering (Week 6)
- [ ] Canvas or SVG-based group space
- [ ] Grassy field environment graphics
- [ ] Snowy playground environment graphics
- [ ] Avatar positioning system
- [ ] Collision detection (avatars don't overlap)

#### Step 3: Avatar Display in Space (Week 7)
- [ ] Render all group member avatars
- [ ] Color coding (blue = normal, white = on call)
- [ ] Labels above avatars
- [ ] Click avatar interaction
- [ ] Send heart from group space

#### Step 4: Retention & Polish (Week 8)
- [ ] Milestone badges (display + earn logic)
- [ ] Group leaderboards
- [ ] Idle animations (breathing, bobbing)
- [ ] Heart floating effects
- [ ] Smooth transitions
- [ ] Mobile touch interactions
- [ ] Performance optimization

**Deliverable**: Engaging group spaces with gamification that drives daily visits

---

## 🚧 TECHNICAL CHALLENGES & SOLUTIONS

### Challenge 1: Real-time Heart Updates
**Problem**: When someone sends a heart, recipient should see it immediately

**Solution**:
- Use Supabase real-time subscriptions
- Subscribe to `hearts` table filtered by `recipient_id`
- Optimistic UI updates (show heart immediately, confirm with server)

### Challenge 2: Multi-day Shift Detection
**Problem**: A shift from Monday 8 AM to Tuesday 6 PM should show "on call" both days

**Solution**:
- Store shifts as `start_datetime` and `end_datetime` (timestamptz)
- Query: "WHERE start_date <= today AND end_date >= today"
- Database view for efficient "who's on call today" queries

### Challenge 3: Avatar Positioning in Group Spaces
**Problem**: Avatars shouldn't overlap, need to distribute nicely

**Solutions**:
- **Option A (Simple)**: Grid layout with assigned slots
- **Option B (Better UX)**: Circular distribution around center
- **Option C (Most Flexible)**: Users can drag avatars, position saved in DB

**Recommendation**: Start with Option B (circular), add drag in V1.1

### Challenge 4: Performance with Many Hearts
**Problem**: An avatar with 50+ hearts might lag on mobile

**Solution**:
- Limit displayed hearts to 20-30 max
- Show counter for total (e.g., "47 🤍")
- Use CSS transforms instead of re-renders
- `will-change` for animation performance
- Consider Canvas rendering for many elements

### Challenge 5: Mobile Touch Interactions in Group Space
**Problem**: Scrolling vs clicking avatars, zoom, pan

**Solution**:
- Disable scroll on group space container
- Implement pinch-to-zoom with react-use-gesture
- Clear tap targets (44px minimum)
- Haptic feedback on interactions (mobile vibration API)

---

## 🎯 SUCCESS METRICS

### V0 Success Criteria
**Technical**:
- [ ] Users can create accounts and avatars
- [ ] Users can add friends
- [ ] Users can send hearts to friends on call
- [ ] Hearts appear around avatars in real-time
- [ ] Works smoothly on mobile (320px+)
- [ ] 5 beta testers use it for 1 week

**Retention** (Target with new features):
- [ ] **DAU/MAU**: 60%
- [ ] **Hearts per active user per day**: 3+
- [ ] **Friends per user**: 5+
- [ ] **D1 Retention**: 40% (with onboarding)
- [ ] **D7 Retention**: 25%
- [ ] **Streaks**: 30% of users have 3+ day streak

### V0.5 Success Criteria
**Technical**:
- [ ] Users prefer automatic call detection over manual checkbox
- [ ] Calendar works reliably for complex shifts
- [ ] Message feed feels personal and supportive

**Retention**:
- [ ] **Hearts sent per user**: 3+ per day
- [ ] **Hearts per call shift**: 8+ received
- [ ] **Session duration**: 3-5 minutes
- [ ] **Weekly recap sharing**: 10% share on social
- [ ] **D30 Retention**: 15%

### V1 Success Criteria
**Technical**:
- [ ] Users create and join groups
- [ ] Group spaces feel fun and engaging
- [ ] Avatar animations don't cause performance issues

**Retention**:
- [ ] **Groups per user**: 1.5 average
- [ ] **Group visits per week**: 4+
- [ ] **Badge engagement**: 50% earn 3+ badges
- [ ] **Free-to-paid conversion**: 10% within 3 months

---

## 💡 DESIGN DECISIONS

### Why Manual Heart Sending (No "Send All")?
**Decision**: Users must click each friend individually to send hearts

**Rationale**:
- Makes support feel intentional, not automated
- Creates a moment of connection for each person
- Takes 10 seconds to send to 5 friends - not burdensome
- More meaningful than bulk actions
- Encourages users to think about each friend

**User flow**:
1. Open "Friends on call today" (5 people listed)
2. Click "Send 🤍" next to Alice
3. Quick success animation
4. Click "Send 🤍" next to Bob
5. Repeat

### Why Read-Only Message Feed?
**Decision**: Recipients see "X wishes you a white call! 🤍" but can't reply

**Rationale**:
- Avoids becoming a chat app (out of scope)
- Reduces pressure on recipients (they're on call, busy!)
- Keeps focus on support, not conversation
- Simpler to build and moderate

### Avatar vs Profile Photos?
**Decision**: Cute animal avatars, not real photos

**Rationale**:
- More fun and playful
- Privacy-friendly (healthcare workers may not want photos)
- Easier to create consistent visual style
- Better for animations and group spaces
- Appeals to target demographic (tired doctors need cute)

---

## 🗺️ ROADMAP

### Month 1: V0 + V0.5
- Weeks 1-2: V0 (core social mechanic)
- Weeks 3-4: V0.5 (calendar integration)

### Month 2: V1
- Weeks 5-8: Group spaces

### Month 3: Beta Testing & Iteration
- Recruit 20-50 healthcare worker beta testers
- Gather feedback
- Fix bugs
- Refine UX

### Month 4-6: Post-V1 Features
- Calendar sync (Google/Apple)
- Push notifications
- Statistics dashboard
- Premium features (TBD)
- Marketing and growth

### Month 7+: Native Apps
- React Native conversion
- iOS App Store
- Android Play Store

---

## 🔐 PRIVACY & SECURITY

### Data Privacy
- Users control who they add as friends
- Groups are private (invite-only)
- Call schedules only visible to friends/group members
- No public profiles or discovery features (in V0-V1)

### Row-Level Security
```sql
-- Users can only read their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can view friends' profiles
CREATE POLICY "Users can view friends' profiles"
ON profiles FOR SELECT
USING (
  id IN (
    SELECT friend_id FROM friendships WHERE user_id = auth.uid()
    UNION
    SELECT user_id FROM friendships WHERE friend_id = auth.uid()
  )
);

-- Users can only send hearts to friends
CREATE POLICY "Users can send hearts to friends"
ON hearts FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  recipient_id IN (
    SELECT friend_id FROM friendships WHERE user_id = auth.uid()
    UNION
    SELECT user_id FROM friendships WHERE friend_id = auth.uid()
  )
);
```

---

## 📝 OPEN QUESTIONS

### For User to Decide

1. **Friend System**:
   - Option A: Friend requests (must accept)
   - Option B: Direct add (no confirmation needed)
   - **Recommendation**: Option A for privacy

2. **Avatar Customization**:
   - V0: Pick animal type only
   - Later: Color variants, accessories, animations?
   - **Recommendation**: Start simple, add later based on feedback

3. **Freemium Model**:
   - What features are free vs premium?
   - Possible premium: Custom avatars, more groups, analytics?
   - **Recommendation**: Decide after V1 based on user behavior

4. **Notifications**:
   - When to notify? (You're on call tomorrow, someone sent you a heart)
   - Push or email? (requires PWA setup or native)
   - **Recommendation**: V2 feature, test demand first

5. **Heart Limits**:
   - Can you send unlimited hearts?
   - Daily limit to prevent spam?
   - **Recommendation**: Start unlimited, add limits if abused

---

## 🎨 UI/UX MOCKUP NOTES

### Home Screen (V0 with Retention Features)
```
┌─────────────────────────┐
│  WhiteCall         [≡] │
├─────────────────────────┤
│    🔥 7-day streak!    │ ← NEW: Streak indicator
├─────────────────────────┤
│                         │
│    [Your Avatar]        │
│       Audrey            │
│    ╭─ 🤍 ──╮           │
│   🤍   🤍   🤍         │
│    ╰── 🤍 ──╯          │
│  "7 white calls!" +2↑  │ ← NEW: Animated counter
│                         │
│  [ ] I'm on call today  │
│                         │
├─────────────────────────┤
│  🆘 Friends who need    │ ← NEW: Smart prioritization (V0.5)
│     support most        │
│  ─────────────────      │
│  🐻 Bob (4 shifts) [🤍]│
│  🐱 Carol (3 shifts)[🤍]│
│                         │
│  💭 Other friends       │
│  ─────────────────      │
│  🐰 Dave           [🤍] │
├─────────────────────────┤
│  [Calendar] [Groups]    │
└─────────────────────────┘
```

### Group Space (V1)
```
┌─────────────────────────┐
│  ← Medical Residents    │
├─────────────────────────┤
│      🌳  🌸  ☀️       │
│                         │
│    🐧     🐻    🐱     │
│   (white) (blue) (blue) │
│   Audrey  Bob   Carol   │
│  on call                │
│            🐰           │
│           (blue)        │
│           Dave          │
│                         │
│    🌼         🌻       │
└─────────────────────────┘
```

---

## ✅ DEFINITION OF DONE

### V0 is complete when:
**Core Features**:
- [ ] User can sign up/login
- [ ] User can create avatar
- [ ] User can add friends (by username)
- [ ] User can check "I'm on call"
- [ ] Friends can see who's on call
- [ ] Friends can send white hearts 🤍
- [ ] Hearts appear around recipient's avatar with animation
- [ ] Real-time updates work

**Retention Features** (CRITICAL):
- [ ] Daily streaks tracking + display
- [ ] Onboarding tutorial with celebration
- [ ] Haptic feedback (mobile) + sound (optional)
- [ ] Heart counter animation
- [ ] Confetti on first heart received

**Quality**:
- [ ] Mobile responsive (tested on 320px, 768px, 1024px)
- [ ] No console errors
- [ ] Deployed to Vercel with Supabase backend

### V0.5 is complete when:
**Core Features**:
- [ ] User can create shift templates
- [ ] User can add shifts to calendar
- [ ] App auto-detects call shifts
- [ ] "I'm on call" checkbox removed
- [ ] "Friends on call today" feed works
- [ ] Message feed shows who sent hearts
- [ ] Calendar handles multi-day shifts correctly

**Retention Features**:
- [ ] Weekly recap screen (shareable)
- [ ] Smart feed prioritizes friends who need support
- [ ] "You made someone's day" feedback
- [ ] Badge system implemented

### V1 is complete when:
**Core Features**:
- [ ] User can create groups
- [ ] User can invite friends to groups
- [ ] Group space renders with chosen environment
- [ ] Avatars display in group space
- [ ] Avatars color-coded by call status
- [ ] Click avatar to send heart works
- [ ] Basic idle animations implemented
- [ ] Smooth performance on mobile

**Retention Features**:
- [ ] Milestone badges displayed in group spaces
- [ ] Group leaderboards (weekly reset)
- [ ] Badge earn notifications

---

---

## 🚫 ANTI-PATTERNS (What NOT to Do)

These features would harm retention, not help:

❌ **Don't add direct messaging**: Becomes a chat app, loses focus on hearts
❌ **Don't show "hours worked" publicly**: Creates toxic comparison culture
❌ **Don't auto-send hearts**: Defeats the intentionality that makes it meaningful
❌ **Don't add read receipts**: Adds pressure during call shifts when users are busy
❌ **Don't let non-friends see profiles**: Privacy is critical for healthcare workers
❌ **Don't gamify receiving hearts**: Would make people compete for victimhood
❌ **Don't send too many notifications**: Respect users' time and attention

---

## 📱 PUSH NOTIFICATION STRATEGY (V0.5+)

**Principle**: Only notify when it matters. Respect sleep and work time.

### Daily Notifications (Max 2 per day):
- **Morning (8 AM)**: "3 friends on call today - send some love! 🤍"
- **Evening (6 PM)**: "You received 5 hearts today! ❤️"

### Weekly Notifications (Sundays at 7 PM):
- **Weekly Recap**: "You sent 23 hearts this week - see your impact!"

### Event Notifications (Real-time):
- **Streak Risk (9 PM)**: "Send a heart to keep your 7-day streak alive! 🔥"
- **Friend Alert**: "Alice has a 30-hour call shift tomorrow - send support!"

### Rules:
- ❌ NEVER notify between 11 PM - 7 AM (respect sleep)
- ❌ NEVER notify during user's own call shifts (they're busy!)
- ✅ Allow users to customize notification times
- ✅ Smart batching: Combine multiple events into one notification
- ✅ Users can disable any notification category

---

## 🌟 VIRAL LOOP STRATEGY

### Built-in Sharing Moments:
1. **After sending 10 hearts**: "Share your support with the world?"
   - Pre-generated image: "I sent 10 white calls this week 🤍 #WhiteCall"
   - Instagram/Twitter ready (1080x1920)

2. **After milestone**: "I survived 10 call shifts! 💪 #WhiteCall"

3. **Weekly recap**: Auto-generated shareable story format

### Referral Incentives (V2):
- "Invite 3 friends → Unlock premium avatar accessories"
- "Your group reaches 10 members → Everyone gets 'Founding Member' badge"

---

## 💰 MONETIZATION (Beyond Basic Premium)

**Current Plan**: $4.99/mo for calendar sync + advanced features

**Additional Revenue Streams**:
1. **Avatar Accessories**: Premium animals, seasonal outfits ($0.99-$2.99 one-time)
2. **Custom Group Environments**: Healthcare-themed spaces ($4.99 per group)
3. **White-label for Hospitals**: "HealthSystem WhiteCall" ($49/mo per hospital)
4. **Wellness Partnerships**: Ethical sponsorships with mental health apps

**Freemium Targets**:
- Free tier: 90% of users (sustainability through volume)
- Premium: 10% conversion within 3 months
- Revenue goal: Profitable at 10,000+ users

---

**Remember**: Start simple, iterate based on user feedback. The core magic is the social support mechanic - the retention features are force multipliers that make users come back daily.

🤍 Let's build something that makes call shifts a little less lonely - and build it to last.
