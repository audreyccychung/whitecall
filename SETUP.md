# WhiteCall - Project Setup Guide

## Project Successfully Set Up! ✓

This document describes the complete setup of the WhiteCall project.

---

## Technology Stack

### Core
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool and dev server

### Styling
- **Tailwind CSS v4** - Utility-first CSS framework
- Custom color palette with soft whites, light blues, and pastels
- Mobile-first responsive design

### Routing & State
- **React Router v6** - Client-side routing
- **Zustand** - Lightweight state management

### Backend & Auth
- **Supabase** - Backend as a Service (authentication, database, real-time)

### UI/UX Enhancements
- **Framer Motion** - Smooth animations
- **Canvas Confetti** - Celebration effects

---

## Project Structure

```
whitecall/
├── src/
│   ├── assets/          # Static files (avatars, sounds)
│   │   ├── avatars/
│   │   └── sounds/
│   ├── components/      # Reusable UI components
│   │   └── Button.tsx   # Example component
│   ├── contexts/        # React Context providers
│   ├── hooks/           # Custom React hooks
│   │   └── useAuth.ts   # Authentication hook
│   ├── lib/             # Core library files
│   │   ├── supabase.ts  # Supabase client
│   │   └── store.ts     # Zustand store
│   ├── pages/           # Full page components
│   │   └── Home.tsx     # Landing page
│   ├── types/           # TypeScript types
│   │   └── index.ts     # Type definitions
│   ├── utils/           # Helper functions
│   │   └── helpers.ts   # Utility functions
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   ├── index.css        # Global styles
│   └── vite-env.d.ts    # Vite environment types
├── .env.example         # Environment variables template
├── .gitignore           # Git ignore rules
├── index.html           # HTML entry point
├── package.json         # Dependencies and scripts
├── postcss.config.js    # PostCSS configuration
├── tailwind.config.js   # Tailwind configuration
├── tsconfig.json        # TypeScript configuration
├── tsconfig.node.json   # TypeScript config for Node
└── vite.config.ts       # Vite configuration
```

---

## Getting Started

### 1. Install Dependencies (Already Done)
```bash
npm install
```

### 2. Set Up Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Then edit `.env` and add your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Start Development Server
```bash
npm run dev
```

Visit http://localhost:3000 to see your app!

### 4. Build for Production
```bash
npm run build
```

### 5. Preview Production Build
```bash
npm run preview
```

---

## Available Scripts

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Type-check with TypeScript

---

## Custom Colors

The project includes a custom color palette optimized for WhiteCall:

### Soft Whites
- `--color-white-call-50` through `--color-white-call-400`

### Light Blues (Sky Soft)
- `--color-sky-soft-50` through `--color-sky-soft-500`

### Pastels
- `--color-pastel-pink`
- `--color-pastel-blue`
- `--color-pastel-purple`
- `--color-pastel-green`
- `--color-pastel-yellow`
- `--color-pastel-peach`

### Shift Type Colors
- `--color-shift-day` - Light blue
- `--color-shift-night` - Indigo
- `--color-shift-evening` - Orange
- `--color-shift-call` - Pink
- `--color-shift-weekend` - Purple

### Usage
```tsx
// In JSX with inline styles
<div style={{ backgroundColor: 'var(--color-sky-soft-500)' }}>
  Content
</div>

// Or use standard Tailwind utilities
<div className="bg-blue-500 text-white">
  Content
</div>
```

---

## Key Files

### Configuration Files

**vite.config.ts**
- Path aliases (`@` = `./src`)
- Build optimizations
- Code splitting configuration

**tsconfig.json**
- Strict TypeScript settings
- Path aliases matching Vite config

**tailwind.config.js**
- Content paths for Tailwind
- Custom color extensions
- Shadow utilities

**postcss.config.js**
- Tailwind PostCSS plugin

### Core Files

**src/main.tsx**
- App entry point
- React 18 root rendering

**src/App.tsx**
- Router setup
- Route definitions

**src/index.css**
- Tailwind imports
- CSS custom properties (color variables)
- Custom component classes
- Global styles

**src/lib/supabase.ts**
- Supabase client initialization
- Environment variable handling

**src/lib/store.ts**
- Zustand store setup
- User state
- UI state (loading, modals)

**src/hooks/useAuth.ts**
- Authentication logic
- Sign in/up/out methods
- Session management

**src/types/index.ts**
- TypeScript interfaces
- User, Shift, Group types
- API response types

---

## Component Patterns

### Creating a Component

```tsx
// src/components/MyComponent.tsx
import { motion } from 'framer-motion'

interface MyComponentProps {
  title: string
  onAction?: () => void
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 rounded-lg"
    >
      <h2 className="text-xl font-bold">{title}</h2>
      {onAction && (
        <button onClick={onAction} className="btn-primary">
          Action
        </button>
      )}
    </motion.div>
  )
}
```

### Creating a Page

```tsx
// src/pages/MyPage.tsx
import { MyComponent } from '@/components/MyComponent'

function MyPage() {
  return (
    <div className="min-h-screen p-4">
      <MyComponent title="Hello" />
    </div>
  )
}

export default MyPage
```

### Creating a Hook

```tsx
// src/hooks/useMyHook.ts
import { useState, useEffect } from 'react'

export function useMyHook() {
  const [data, setData] = useState(null)

  useEffect(() => {
    // Fetch or compute data
  }, [])

  return { data }
}
```

---

## Supabase Setup

The Supabase client is configured but requires credentials. To set up:

1. Create a project at https://supabase.com
2. Go to Project Settings > API
3. Copy the Project URL and anon/public key
4. Add them to your `.env` file

**Database Schema** (from CLAUDE.md):
- `users` - User profiles
- `shift_templates` - Shift template definitions
- `shifts` - User shift instances
- `groups` - Friend/colleague groups
- `group_members` - Group membership

See `SUPABASE_SETUP.md` for detailed database setup instructions.

---

## Mobile-First Design

All designs start mobile (320px) and expand:
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

### Touch Targets
Minimum 44px × 44px for all interactive elements (use `.touch-target` class)

---

## Code Quality

### TypeScript
- All files use TypeScript
- Strict mode enabled
- No `any` types (use proper types or `unknown`)

### Naming Conventions
- **Components**: PascalCase (`Button.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`)
- **Utils**: camelCase (`helpers.ts`)
- **Types**: PascalCase (`User`, `Shift`)

### File Organization
- One component per file
- Export as named export for components
- Default export for pages
- Group related utilities in same file

---

## Next Steps

1. **Set up Supabase** - Add credentials to `.env`
2. **Create database schema** - See `SUPABASE_SETUP.md`
3. **Build authentication flow** - Sign up, sign in pages
4. **Create core features** - Shift management, calendar views
5. **Add group features** - Friend groups, availability finder

---

## Troubleshooting

### Port Already in Use
If port 3000 is taken, Vite will prompt to use a different port. Or specify manually:
```bash
npm run dev -- --port 3001
```

### Build Fails
Run type checking to see TypeScript errors:
```bash
npm run lint
```

### Tailwind Classes Not Working
Make sure the file is included in `tailwind.config.js` content paths.

### Module Not Found
Check import paths use `@/` prefix for src imports:
```tsx
import { Button } from '@/components/Button'
```

---

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://typescriptlang.org/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Framer Motion](https://framer.com/motion)
- [Zustand](https://zustand-demo.pmnd.rs)

---

## Support

For project-specific questions, refer to:
- `CLAUDE.md` - Development guidelines and project context
- `README.md` - Product overview
- `WHITECALL.md` - Detailed feature specifications

---

**Happy coding! 🚀**
