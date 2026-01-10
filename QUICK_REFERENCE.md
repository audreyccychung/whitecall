# WhiteCall - Quick Reference

## Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Type-check with TypeScript

# Project
npm install          # Install dependencies
npm update           # Update dependencies
```

## File Structure

```
src/
├── assets/          # Images, sounds, static files
├── components/      # Reusable UI components
├── contexts/        # React Context providers
├── hooks/           # Custom React hooks
├── lib/             # Core libraries (Supabase, store)
├── pages/           # Full page components (routes)
├── types/           # TypeScript type definitions
├── utils/           # Helper functions
├── App.tsx          # Main app with routing
├── main.tsx         # Entry point
└── index.css        # Global styles + Tailwind
```

## Import Paths

```tsx
// Use @ alias for src imports
import { Button } from '@/components/Button'
import { useAuth } from '@/hooks/useAuth'
import { User } from '@/types'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'
import { formatDate } from '@/utils/helpers'
```

## Common Patterns

### Create a Component
```tsx
// src/components/MyComponent.tsx
interface MyComponentProps {
  title: string
}

export function MyComponent({ title }: MyComponentProps) {
  return <div>{title}</div>
}
```

### Create a Page
```tsx
// src/pages/MyPage.tsx
function MyPage() {
  return <div>My Page</div>
}

export default MyPage
```

### Add a Route
```tsx
// src/App.tsx
<Route path="/my-page" element={<MyPage />} />
```

### Use Zustand Store
```tsx
import { useAppStore } from '@/lib/store'

function MyComponent() {
  const { user, setUser } = useAppStore()
  // ...
}
```

### Use Framer Motion
```tsx
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  Content
</motion.div>
```

### Call Supabase
```tsx
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase
  .from('shifts')
  .select('*')
```

## Custom Colors

```tsx
// Use CSS variables for custom colors
<div style={{ backgroundColor: 'var(--color-sky-soft-500)' }}>
  Content
</div>

// Available colors:
// --color-white-call-50 to --color-white-call-400
// --color-sky-soft-50 to --color-sky-soft-500
// --color-pastel-pink, blue, purple, green, yellow, peach
// --color-shift-day, night, evening, call, weekend
```

## Tailwind Utilities

```tsx
// Mobile-first responsive design
<div className="text-sm md:text-base lg:text-lg">
  Responsive text
</div>

// Touch-friendly interactive elements
<button className="touch-target">
  Button
</button>

// Custom classes
<div className="card">Card content</div>
<button className="btn-primary">Primary</button>
<button className="btn-secondary">Secondary</button>
<input className="input-field" />
```

## TypeScript Types

```tsx
import { User, Shift, Group } from '@/types'

// User
interface User {
  id: string
  email: string
  display_name?: string
}

// Shift
interface Shift {
  id: string
  user_id: string
  start_datetime: Date
  end_datetime: Date
}

// API Response
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
```

## Environment Variables

```tsx
// Access in code
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Add to .env file
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key
```

## Authentication

```tsx
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, loading, signIn, signUp, signOut } = useAuth()

  const handleSignIn = async () => {
    const { data, error } = await signIn('email@example.com', 'password')
  }

  return <div>{user ? 'Logged in' : 'Not logged in'}</div>
}
```

## Confetti Effect

```tsx
import confetti from 'canvas-confetti'

const celebrate = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  })
}

<button onClick={celebrate}>Celebrate!</button>
```

## Git Workflow

```bash
# Check status
git status

# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add shift calendar view"

# Push to remote
git push origin main

# Commit types:
# feat: new feature
# fix: bug fix
# refactor: code refactoring
# style: formatting, CSS
# docs: documentation
# test: tests
```

## Common Issues

**Port in use**: `npm run dev -- --port 3001`
**Type errors**: `npm run lint`
**Module not found**: Check import uses `@/` prefix
**Tailwind not working**: Check file in `tailwind.config.js` content

## Keyboard Shortcuts (VS Code)

- `Cmd+P` - Quick file open
- `Cmd+Shift+P` - Command palette
- `Cmd+B` - Toggle sidebar
- `Cmd+/` - Toggle comment
- `Option+Shift+F` - Format document
- `F12` - Go to definition
- `Cmd+Click` - Go to definition

---

For full details, see `SETUP.md` and `CLAUDE.md`
