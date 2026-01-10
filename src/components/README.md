# Components

Reusable UI components used throughout the application.

## Structure
- Generic UI components go directly in this folder (Button, Input, Card, etc.)
- Feature-specific components can be organized in subdirectories

## Naming Convention
- Use PascalCase for component files (e.g., `Button.tsx`, `ShiftCard.tsx`)
- Each component should be in its own file
- Export the component as a named export

## Example
```tsx
interface ButtonProps {
  children: React.ReactNode
  onClick: () => void
}

export function Button({ children, onClick }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>
}
```
