# Hooks

Custom React hooks for shared logic across components.

## Naming Convention
- Use camelCase with `use` prefix (e.g., `useAuth.ts`, `useShifts.ts`)
- Each hook should handle a specific concern
- Hooks can use other hooks

## Example
```tsx
import { useState, useEffect } from 'react'

export function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    function updateSize() {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', updateSize)
    updateSize()
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  return size
}
```
