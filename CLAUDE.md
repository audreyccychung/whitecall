# CLAUDE.md - Development Context & Guidelines

**Last Updated**: 2026-01-10
**Project**: WhiteCall (formerly Shift Calendar)
**Stage**: V0 Development - Social Support MVP

---

## 🎯 PROJECT OVERVIEW

### What We're Building
**WhiteCall** - A social support app for healthcare workers facing call shifts.

"White call" (白鐘) is Hong Kong medical slang for a peaceful call shift where you get to sleep. When doctors/nurses are on call, friends can send them white hearts 🤍 as encouragement.

**Core Features** (by version):
- **V0 (Now)**: Avatars, friends, send hearts, real-time support
- **V0.5**: Calendar integration, auto-detect call shifts
- **V1**: Group spaces where avatars hang out in cute environments
- **Post-V1**: Calendar sync (Google/Apple), availability finder, statistics

### Target Users
- Primary: Doctors and nurses with irregular call schedules
- Secondary: Any healthcare worker with shift-based work
- Use Case: Building emotional support into the brutal reality of 24-34 hour shifts

### Core Problem We're Solving
Call shifts are **isolating and brutal**. Existing apps are purely functional (schedule management) but miss the **emotional support** aspect. WhiteCall transforms call shifts from lonely experiences into moments of community connection.

---

## 🏗️ TECHNICAL ARCHITECTURE

### Tech Stack Decisions

**Frontend**: React 18 + TypeScript + Vite
- **Why React**: Large ecosystem, good for complex UIs, excellent tooling
- **Why TypeScript**: Type safety catches bugs early, better developer experience
- **Why Vite**: Much faster than Create React App, modern build tool

**Styling**: Tailwind CSS
- **Why**: Rapid development, mobile-first, consistent design system
- **Pattern**: Use Tailwind utility classes directly, minimal custom CSS
- **Mobile-first**: All designs start mobile, then expand to desktop

**Backend**: Supabase
- **Why over Firebase**: Better DX, PostgreSQL (more powerful than Firestore), built-in auth
- **Features used**: Auth, PostgreSQL, real-time subscriptions, row-level security
- **Cost**: Free tier sufficient for first 500-1,000 users

**Routing**: React Router v6
- **Pattern**: File-based route organization in `src/pages/`

**Date Handling**: date-fns
- **Why**: Lightweight, immutable, better than Moment.js

**Forms**: react-hook-form
- **Why**: Performant, minimal re-renders, great validation

**State Management**: Zustand
- **Why**: Simpler than Redux, sufficient for app size, easy to learn
- **When to use**: Global state (user auth, UI state)
- **When NOT to use**: Server state (use React Query or direct Supabase)

**Deployment**: 
- Frontend: Vercel (auto-deploy from GitHub)
- Backend: Supabase cloud

---

## 📐 CODE PATTERNS & CONVENTIONS

### File Naming
- **Components**: PascalCase (e.g., `CalendarView.tsx`, `ShiftCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`, `useShifts.ts`)
- **Services**: camelCase (e.g., `authService.ts`, `shiftService.ts`)
- **Utils**: camelCase (e.g., `formatDate.ts`, `validation.ts`)
- **Types**: PascalCase (e.g., `Shift.ts`, `User.ts`)

### Folder Structure
```
src/
├── pages/              # Full-page components (one per route)
├── components/         # Reusable UI components
│   ├── ui/            # Generic UI elements (Button, Input, Modal)
│   └── features/      # Feature-specific components (ShiftCard, GroupList)
├── hooks/             # Custom React hooks
├── services/          # API calls and business logic
├── utils/             # Pure functions, helpers
├── types/             # TypeScript interfaces and types
├── contexts/          # React Context providers (if needed)
├── App.tsx            # Main app with routing
└── main.tsx           # Entry point
```

### TypeScript Patterns
```typescript
// Use interfaces for object shapes
interface Shift {
  id: string;
  user_id: string;
  template_id: string;
  start_date: Date;
  end_date: Date;
  created_at: Date;
}

// Use types for unions, primitives
type ShiftStatus = 'upcoming' | 'active' | 'completed';

// Always type function parameters and returns
function calculateDuration(start: Date, end: Date): number {
  // ...
}

// Use optional chaining and nullish coalescing
const userName = user?.name ?? 'Guest';
```

### Component Patterns
```typescript
// Functional components with TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export function Button({ 
  label, 
  onClick, 
  variant = 'primary',
  disabled = false 
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`...tailwind classes...`}
    >
      {label}
    </button>
  );
}
```

### Database Patterns
- **Table naming**: snake_case (e.g., `shift_templates`, `group_members`)
- **Column naming**: snake_case (e.g., `user_id`, `created_at`)
- **Primary keys**: UUID (e.g., `id uuid primary key default gen_random_uuid()`)
- **Foreign keys**: Explicit naming (e.g., `user_id` references `users(id)`)
- **Timestamps**: Always include `created_at`, consider `updated_at`

### Error Handling
```typescript
// Always handle errors explicitly
try {
  const data = await shiftService.create(shift);
  return { success: true, data };
} catch (error) {
  console.error('Failed to create shift:', error);
  return { 
    success: false, 
    error: error instanceof Error ? error.message : 'Unknown error' 
  };
}
```

---

## 🚫 CRITICAL GUIDELINES

### BACKWARD COMPATIBILITY: NOT A PRIORITY
**We do NOT maintain backward compatibility during development.**
- Feel free to refactor existing code
- Change function signatures if it improves the design
- Rename components or restructure files
- Update database schema (we'll handle migrations)
- Breaking changes are acceptable during MVP phase

**Rationale**: Speed and quality matter more than stability during initial development. Once we launch v1.0, we'll be more careful about breaking changes.

### ACCURACY OVER SPEED
**Claude must NEVER hallucinate or make up information.**

❌ **BAD**:
```
"I'll use the ShiftAPI.createShift() method..."
```
(If ShiftAPI doesn't exist yet)

✅ **GOOD**:
```
"I don't see a ShiftAPI defined yet. Should I create one with a createShift() method? 
What parameters should it accept?"
```

**When Uncertain:**
1. State you're unsure
2. Ask clarifying questions
3. Propose options with tradeoffs
4. Wait for confirmation

**Examples of when to ask:**
- "Should the shift start time be stored in UTC or local timezone?"
- "Do we want to validate shift duration on the client, server, or both?"
- "I can implement this three ways: [A], [B], or [C]. Which fits better?"

### PLAN MODE: USE FREQUENTLY
**Before implementing ANY new feature or significant change:**

1. **Enter Plan Mode**: Stop and think through the approach
2. **Break down the feature**: What components, hooks, services are needed?
3. **Identify dependencies**: What needs to be built first?
4. **Consider edge cases**: What can go wrong?
5. **Write the plan**: Document it in the plan file
6. **Present summary**: Show user what was planned
7. **Wait for approval**: User says "looks good" or "proceed"
8. **Exit Plan Mode**: Only after user approval

**CRITICAL: ExitPlanMode Protocol**
⚠️ **NEVER call ExitPlanMode automatically!** It requires user approval.

**Correct flow:**
```
1. Write plan to .claude/plans/ file
2. Present summary to user
3. Ask: "Would you like me to proceed with this plan?"
4. Wait for user response ("yes" / "looks good" / "proceed")
5. THEN call ExitPlanMode
```

**Incorrect flow (causes blocking):**
```
1. Write plan ❌
2. Immediately call ExitPlanMode ← BLOCKS HERE
3. Get stuck waiting
```

**Triggers for Plan Mode:**
- User requests a new feature
- Major refactoring needed
- Database schema changes
- New third-party integration
- Uncertainty about approach
- Multiple ways to solve a problem

**Example Plan Mode Response:**
```
🎯 PLAN MODE: Building Group Availability Finder

ANALYSIS:
- This is a complex feature with performance implications
- Need to query all group members' shifts efficiently
- Need to handle timezone differences
- UI needs to be fast (can't block on slow queries)

APPROACH:
1. Database query optimization
   - Create indexed view for shift lookups
   - Cache availability calculations

2. Frontend components needed:
   - AvailabilityFinder.tsx (main UI)
   - TimeSlotList.tsx (shows results)
   - FilterPanel.tsx (date range, duration, etc.)

3. Backend services:
   - availabilityService.ts (calculation logic)
   - Consider: Should this run in a Supabase function?

4. Edge cases to handle:
   - Timezone mismatches
   - Very large groups (99 members)
   - Overlapping shifts
   - Partial day availability

QUESTIONS:
1. Should availability be calculated real-time or pre-cached?
2. How far into the future should users be able to search?
3. What's the timeout for slow calculations?

---

I've written the full plan to .claude/plans/[plan-file].md

Would you like me to proceed with this approach, or do you want to adjust the plan?
[WAIT FOR USER RESPONSE BEFORE CALLING ExitPlanMode]
```

### PROACTIVE ISSUE DETECTION
**When you spot potential problems, speak up immediately.**

**Examples of issues to flag:**
- Performance concerns: "This will be slow with 1000+ shifts"
- Security risks: "This exposes user data without auth check"
- UX problems: "This requires 5 clicks - too many"
- Data integrity: "This could create orphaned records"
- Scalability: "This won't work with 99 group members"
- Edge cases: "What if the user's shift spans midnight?"

**How to flag issues:**
```
⚠️ POTENTIAL ISSUE: [brief description]

PROBLEM:
[Explain the issue clearly]

IMPACT:
[What could go wrong]

SOLUTIONS:
1. [Option A with pros/cons]
2. [Option B with pros/cons]
3. [Option C with pros/cons]

RECOMMENDATION:
[Your suggested approach and why]

Should we address this now or later?
```

### SUBAGENTS: USE WHEN HELPFUL
**When a task would benefit from specialized assistance, suggest creating a subagent.**

**Good use cases for subagents:**
- Database schema design and migration
- UI/UX design and component library
- Testing strategy and test writing
- Performance optimization
- Security audit
- Documentation generation

**How to suggest:**
```
💡 SUBAGENT SUGGESTION

TASK: [What needs to be done]

WHY A SUBAGENT HELPS:
[Explain the benefit - e.g., specialized focus, parallel work, different expertise]

WHAT THE SUBAGENT WOULD DO:
[Specific deliverables]

EXAMPLE:
"I notice we're about to build a complex form system with validation. Should I create 
a 'Form Design Subagent' to:
- Design reusable form patterns
- Create validation schemas
- Build error handling
- Set up form testing patterns
This way we get consistent forms across the app."

Should I create this subagent?
```

---

## 🎨 DESIGN PHILOSOPHY

### Mobile-First
- All designs start with mobile (320px width)
- Expand to tablet (768px) and desktop (1024px+)
- Touch targets: Minimum 44px × 44px
- Thumb-friendly navigation (bottom of screen)

### Simplicity Over Features
- When in doubt, simpler is better
- Remove steps, don't add them
- One primary action per screen
- Progressive disclosure (hide advanced features)

### Healthcare Worker Context
- Users are often tired, stressed, in a hurry
- Minimize cognitive load
- Clear visual hierarchy
- Error prevention over error recovery
- Forgiving undo/edit capabilities

### Visual Style
- Clean, professional, not playful
- High contrast for readability
- Colorful but purposeful (colors indicate shift types)
- Generous whitespace
- Large, readable fonts (16px minimum)

---

## 📊 FEATURE PRIORITIZATION

### MVP Features (Must-Have for v0.1)
1. ✅ Project setup
2. ⏳ Authentication (email, Google, Apple)
3. ⏳ Shift template creation
4. ⏳ Monthly calendar view
5. ⏳ Add/edit/delete shifts
6. ⏳ Multi-day shift support
7. ⏳ Group creation
8. ⏳ Group calendar view
9. ⏳ Availability finder
10. ⏳ Basic statistics

### Post-MVP (v0.2+)
- Calendar sync (Google/Apple)
- iCal feed generation
- Payment integration (Stripe)
- Premium features activation
- Push notifications
- Shift swapping
- Export to Excel/CSV

### Explicitly Out of Scope (Not Building Yet)
- Native mobile apps (web-first)
- Shift trading marketplace
- Messaging/chat between users
- Certification tracking
- Sleep tracking integration
- Hospital/department management features
- Automated scheduling

---

## 💳 BUSINESS MODEL

### Freemium Tiers
**Free:**
- Up to 5 shift templates
- Up to 3 groups
- Up to 10 members per group
- Basic statistics

**Premium ($4.99/month or $49/year):**
- **Calendar sync** (primary value driver)
- iCal feed generation
- Unlimited shift templates
- Unlimited groups
- Up to 99 members per group
- Advanced statistics

### Pricing Rationale
- Cheaper than MyDuty ($2.99/mo) but with MORE features
- Calendar sync justifies premium (major pain point)
- Free tier is genuinely useful (not crippled)
- Target: 10% conversion rate (industry standard)
- Break-even: ~150 premium subscribers

---

## 🗄️ DATABASE SCHEMA OVERVIEW

### Core Tables

**users** (managed by Supabase Auth)
- Extended with: `display_name`, `profession`, `timezone`

**shift_templates**
- `id` (uuid, PK)
- `user_id` (uuid, FK → users)
- `name` (text) - e.g., "Day Shift", "Weekend Call"
- `color` (text) - hex color code
- `default_start_time` (time) - e.g., "08:00"
- `default_duration_hours` (int) - e.g., 12, 24, 34
- `created_at` (timestamp)

**shifts**
- `id` (uuid, PK)
- `user_id` (uuid, FK → users)
- `template_id` (uuid, FK → shift_templates)
- `start_datetime` (timestamptz) - includes date + time
- `end_datetime` (timestamptz) - automatically calculated
- `notes` (text, optional)
- `created_at` (timestamp)

**groups**
- `id` (uuid, PK)
- `name` (text)
- `description` (text, optional)
- `created_by` (uuid, FK → users)
- `created_at` (timestamp)

**group_members**
- `id` (uuid, PK)
- `group_id` (uuid, FK → groups)
- `user_id` (uuid, FK → users)
- `role` (text) - 'admin' or 'member'
- `joined_at` (timestamp)
- Unique constraint on (group_id, user_id)

**availability_cache** (future optimization)
- For caching availability calculations
- Consider: Is this premature optimization?

### Row-Level Security (RLS)
- Users can only see their own shifts/templates
- Group members can see each other's shifts
- Group admins can manage membership

---

## 🔐 SECURITY CONSIDERATIONS

### Authentication
- Email/password with strong password requirements (min 8 chars)
- OAuth with Google and Apple Sign-In
- No social features = lower security risk

### Data Privacy
- Healthcare workers share work schedules, NOT patient data
- Still: Treat all data as sensitive
- HIPAA not required (no PHI), but privacy-minded design

### API Security
- All API calls authenticated with Supabase JWT
- Row-level security on all tables
- Validate inputs client AND server side
- Rate limiting on availability searches (prevent abuse)

---

## 🐛 KNOWN ISSUES & TECHNICAL DEBT

*This section will be updated as we build.*

### Current Issues
- None yet (project just started)

### Technical Debt
- None yet

### Future Considerations
- Real-time collaboration: Do we need WebSocket for group updates?
- Offline support: Should the app work without internet?
- Performance: How do we handle groups with 99 members?

---

## 📝 DEVELOPMENT NOTES

### Git Workflow
- Commit frequently (after each feature/fix)
- Descriptive commit messages: "feat: add shift template creation"
- Branches not required during solo development
- Push to GitHub regularly (backup + Vercel auto-deploy)

### Testing Strategy
- Manual testing during MVP (speed over test coverage)
- Add automated tests post-MVP (React Testing Library + Vitest)
- Focus tests on critical paths: auth, data integrity, calculations

### Code Review
- Self-review: Read your own code before committing
- Look for: Bugs, edge cases, performance issues, confusing logic
- Claude reviews: Ask Claude to review code for issues

### Performance
- Monitor bundle size (keep under 500KB gzipped)
- Lazy load routes (React Router code splitting)
- Optimize images (WebP format)
- Database query optimization (indexes on frequently queried columns)

---

## 🎯 SUCCESS METRICS

### Development Phase
- MVP completed in 3 months
- All core features working reliably
- Mobile-responsive on all screens
- No critical bugs

### Beta Phase (Month 4-6)
- 20-50 beta testers
- Average session time > 5 minutes
- Feature completion rate > 80%
- Bug reports < 5 per week

### Launch Phase (Month 7+)
- 1,000 total users in first 6 months
- 10% free-to-paid conversion
- 150+ premium subscribers (break-even)
- Net Promoter Score (NPS) > 50

---

## 💬 COMMUNICATION STYLE

### When Explaining Code
- Use clear, simple language
- Relate to medical concepts when helpful
- Show examples
- Explain WHY, not just WHAT

### When Asking Questions
- Present options with pros/cons
- Explain implications clearly
- Don't ask yes/no questions when open-ended is better
- Provide defaults but allow customization

### When Detecting Issues
- Be direct and clear
- Explain impact and severity
- Propose solutions
- Don't sugarcoat problems

---

## 🔄 ITERATION PHILOSOPHY

### Build → Test → Learn → Improve
1. Build the simplest version that works
2. Test with real usage
3. Learn what users actually need
4. Improve based on data, not assumptions

### Perfect is the Enemy of Good
- Ship working features, iterate based on feedback
- Don't over-engineer during MVP
- Refactor when complexity becomes a problem
- Add features users actually request, not "nice to haves"

### User Feedback Loop
- Beta testers are doctors/nurses (our target users)
- Listen to pain points, not feature requests
- Validate assumptions with data
- Be willing to pivot if needed

---

## 🎓 LEARNING RESOURCES

### For the Developer (Human)
- React docs: react.dev
- TypeScript handbook: typescriptlang.org/docs
- Tailwind docs: tailwindcss.com/docs
- Supabase docs: supabase.com/docs
- date-fns docs: date-fns.org/docs

### For Claude
- This CLAUDE.md file (read frequently!)
- README.md (product overview)
- CHANGELOG.md (track what's been built)
- Code in src/ directory (understand existing patterns)

---

## 📞 WHEN IN DOUBT

**Ask these questions:**
1. Does this align with the project goals?
2. Will this be simple for healthcare workers to use?
3. Is this the minimal solution that works?
4. Are there edge cases I'm missing?
5. Should I enter Plan Mode before proceeding?

**Remember:**
- Accuracy > Speed
- Simple > Complex
- Working > Perfect
- Users > Features

---

## ✅ CHECKLIST FOR EVERY FEATURE

Before marking a feature "done":

- [ ] Works on mobile (320px width)
- [ ] Works on tablet (768px width)
- [ ] Works on desktop (1024px+ width)
- [ ] Error states handled gracefully
- [ ] Loading states shown
- [ ] Empty states considered
- [ ] TypeScript types complete
- [ ] No console errors
- [ ] Accessible (keyboard navigation, screen readers)
- [ ] Code is readable and documented
- [ ] Committed to Git with clear message

---

## 📅 VERSION HISTORY

- **v0.0.1** (2026-01-10): Project initialization, documentation created
- **v0.1.0** (Target: Month 3): MVP complete
- **v1.0.0** (Target: Month 6): Public launch

---

**Remember**: This document is a living guide. Update it as the project evolves. When in doubt, refer back to the principles here.

🚀 Let's build something great!
