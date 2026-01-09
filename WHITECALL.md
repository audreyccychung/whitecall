# WhiteCall - Social Support for Healthcare Workers

**Last Updated**: 2026-01-10
**Project**: WhiteCall (formerly Shift Calendar)
**Status**: Planning Phase

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
**Goal**: Validate the social support mechanic

**Features**:
- User creates cute avatar (e.g., penguin character)
- Manual "I'm on call today!" checkbox
- Users can connect with other users (friends/colleagues)
- Send white hearts 🤍 to friends on call
- Hearts appear around recipient's avatar
- Simple, clean UI focused on the heart-sending experience

**Scope**:
- No calendar integration yet
- No group spaces
- Basic auth (email/password)
- Static avatars (no movement)
- Web-only (mobile-responsive)

### V0.5 - Calendar Integration (Week 3-4)
**Goal**: Automate call shift detection and streamline support sending

**Features**:
- Calendar function: Users input their shifts
- App automatically knows who's on call
- "Friends on call today" feed/list
- One-by-one heart sending (click each friend individually)
- Notification-style message feed: "Audrey wishes you a white call! 🤍"
- Messages stack like a chat but are read-only (no replies)
- See who sent you hearts

**Key UX Decision**:
- **NO "Send to All" button** - Users must click each friend individually
- **Why**: Makes support feel personal and intentional, not automated
- Creates a moment of connection for each person

### V1 - Group Spaces (Week 5-8)
**Goal**: Create shared virtual spaces for teams/friend groups

**Features**:
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

**Stretch Goals (V1.1)**:
- Avatar wandering/movement in the space
- Seasonal environment changes
- Custom group environments

### Post-V1 Features (Future)
- Calendar sync (Google/Apple)
- Group availability finder
- Statistics (hours worked, hearts received)
- Premium features (TBD)
- Push notifications
- Native app (iOS/Android)

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

#### Step 6: Polish & Testing (Day 10-12)
- [ ] Mobile responsive design
- [ ] Error handling
- [ ] Loading states
- [ ] Basic animations
- [ ] Manual testing
- [ ] Bug fixes

**Deliverable**: Working demo where users can create avatars, add friends, mark themselves on call, and send/receive hearts

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

#### Step 5: Testing & Refinement
- [ ] Test calendar with various shift patterns
- [ ] Test auto-detection accuracy
- [ ] Mobile testing
- [ ] Performance optimization

**Deliverable**: Users can manage shifts in calendar, app auto-detects call shifts, friends can send hearts one-by-one

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

#### Step 4: Animations & Polish (Week 8)
- [ ] Idle animations (breathing, bobbing)
- [ ] Heart floating effects
- [ ] Smooth transitions
- [ ] Mobile touch interactions
- [ ] Performance optimization

**Deliverable**: Users can create groups, see members in cute environments, send hearts by clicking avatars

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
- [ ] Users can create accounts and avatars
- [ ] Users can add friends
- [ ] Users can send hearts to friends on call
- [ ] Hearts appear around avatars in real-time
- [ ] Works smoothly on mobile (320px+)
- [ ] 5 beta testers use it for 1 week

### V0.5 Success Criteria
- [ ] Users prefer automatic call detection over manual checkbox
- [ ] Users send hearts to 3+ friends on average
- [ ] Message feed feels personal and supportive
- [ ] Calendar works reliably for complex shifts

### V1 Success Criteria
- [ ] Users create and join groups
- [ ] Group spaces feel fun and engaging
- [ ] Users visit group spaces daily
- [ ] Avatar animations don't cause performance issues

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

### Home Screen (Logged In)
```
┌─────────────────────────┐
│  WhiteCall         [≡] │
├─────────────────────────┤
│                         │
│    [Your Avatar]        │
│       Audrey            │
│    ╭─ 🤍 ──╮           │
│   🤍   🤍   🤍         │
│    ╰── 🤍 ──╯          │
│    "7 white calls!"     │
│                         │
│  [ ] I'm on call today  │
│                         │
├─────────────────────────┤
│  Friends on call        │
│  ─────────────────      │
│  🐻 Bob    [Send 🤍]   │
│  🐱 Carol  [Send 🤍]   │
│  🐰 Dave   [Send 🤍]   │
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
- [ ] User can sign up/login
- [ ] User can create avatar
- [ ] User can add friends (by username)
- [ ] User can check "I'm on call"
- [ ] Friends can see who's on call
- [ ] Friends can send white hearts 🤍
- [ ] Hearts appear around recipient's avatar with animation
- [ ] Real-time updates work
- [ ] Mobile responsive (tested on 320px, 768px, 1024px)
- [ ] No console errors
- [ ] Deployed to Vercel with Supabase backend

### V0.5 is complete when:
- [ ] User can create shift templates
- [ ] User can add shifts to calendar
- [ ] App auto-detects call shifts
- [ ] "I'm on call" checkbox removed
- [ ] "Friends on call today" feed works
- [ ] Message feed shows who sent hearts
- [ ] Calendar handles multi-day shifts correctly

### V1 is complete when:
- [ ] User can create groups
- [ ] User can invite friends to groups
- [ ] Group space renders with chosen environment
- [ ] Avatars display in group space
- [ ] Avatars color-coded by call status
- [ ] Click avatar to send heart works
- [ ] Basic idle animations implemented
- [ ] Smooth performance on mobile

---

**Remember**: Start simple, iterate based on user feedback. The core magic is the social support mechanic - everything else supports that.

🤍 Let's build something that makes call shifts a little less lonely.
