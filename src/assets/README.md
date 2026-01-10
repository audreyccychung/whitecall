# Assets

Static files including images, sounds, and other media.

## Structure
- `avatars/` - User avatar images and placeholder avatars
- `sounds/` - Sound effects (e.g., notification sounds)
- Other static assets as needed

## Guidelines
- Optimize images before adding (use WebP format when possible)
- Keep file sizes small (< 100KB for most images)
- Use descriptive filenames (e.g., `default-avatar.png`, `notification-sound.mp3`)

## Importing Assets
```tsx
import avatarImage from '@/assets/avatars/default-avatar.png'
import notificationSound from '@/assets/sounds/notification.mp3'
```
