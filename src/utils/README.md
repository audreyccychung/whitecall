# Utils

Pure utility functions and helper methods.

## Naming Convention
- Use camelCase (e.g., `formatDate.ts`, `validation.ts`)
- Functions should be pure (no side effects)
- Each file should export related utility functions

## Example
```tsx
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US').format(date)
}

export function calculateDuration(start: Date, end: Date): number {
  return end.getTime() - start.getTime()
}
```
