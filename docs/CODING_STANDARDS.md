# Coding Standards

Naming conventions and patterns for the WhiteCall codebase.

## Types (`src/types/`)

TypeScript type definitions and interfaces.

- Use **PascalCase** for interfaces and types
- Group related types in the same file
- Export all types as named exports

```tsx
export interface User {
  id: string
  email: string
  display_name?: string
}

export type ShiftStatus = 'upcoming' | 'active' | 'completed'
```

## Components (`src/components/`)

Reusable UI components.

- Use **PascalCase** for component files (e.g., `Button.tsx`, `ShiftCard.tsx`)
- Each component in its own file
- Export as named export

```tsx
interface ButtonProps {
  children: React.ReactNode
  onClick: () => void
}

export function Button({ children, onClick }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>
}
```

## Hooks (`src/hooks/`)

Custom React hooks for shared logic.

- Use **camelCase** with `use` prefix (e.g., `useAuth.ts`, `useShifts.ts`)
- Each hook handles a specific concern
- Hooks can compose other hooks

```tsx
export function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 })
  // ...
  return size
}
```

## Utils (`src/utils/`)

Pure utility functions.

- Use **camelCase** (e.g., `formatDate.ts`, `validation.ts`)
- Functions should be **pure** (no side effects)
- Group related utilities in the same file

```tsx
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US').format(date)
}
```

## Contexts (`src/contexts/`)

React contexts for global state.

- Use **PascalCase** with `Context` suffix (e.g., `AuthContext.tsx`)
- Export both the context and a custom hook (`useAuth`)
- Single source of truth for their domain
