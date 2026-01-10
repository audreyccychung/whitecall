# Pages

Full-page components that correspond to routes in the application.

## Naming Convention
- Use PascalCase (e.g., `Home.tsx`, `Dashboard.tsx`, `ShiftCalendar.tsx`)
- One page per route
- Pages should be composed of components from the `components` folder

## Example
```tsx
import { Header } from '@/components/Header'
import { ShiftList } from '@/components/ShiftList'

function Dashboard() {
  return (
    <div>
      <Header />
      <ShiftList />
    </div>
  )
}

export default Dashboard
```
