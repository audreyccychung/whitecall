# Types

TypeScript type definitions and interfaces.

## Naming Convention
- Use PascalCase for interfaces and types
- Group related types in the same file
- Export all types as named exports

## Example
```tsx
export interface User {
  id: string
  email: string
  display_name?: string
}

export interface Shift {
  id: string
  user_id: string
  start_datetime: Date
  end_datetime: Date
}

export type ShiftStatus = 'upcoming' | 'active' | 'completed'
```
