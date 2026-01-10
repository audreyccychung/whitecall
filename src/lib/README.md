# Lib

Core library files including external service configurations and global state.

## Contents
- `supabase.ts` - Supabase client configuration
- `store.ts` - Zustand global state management
- Other third-party service configurations

## Example
```tsx
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```
