// Reusable avatar display component
import { getAvatarEmoji } from '../types/avatar';

interface AvatarDisplayProps {
  avatarType: string;
  avatarColor: string;
  size?: 'small' | 'medium' | 'large' | 'xl';
  className?: string;
}

const sizeClasses = {
  small: 'w-12 h-12 text-2xl',
  medium: 'w-16 h-16 text-4xl',
  large: 'w-24 h-24 text-6xl',
  xl: 'w-32 h-32 text-8xl',
};

export function AvatarDisplay({
  avatarType,
  avatarColor,
  size = 'medium',
  className = '',
}: AvatarDisplayProps) {
  const emoji = getAvatarEmoji(avatarType as any);

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${className}`}
      style={{ backgroundColor: avatarColor }}
    >
      <span className="select-none">{emoji}</span>
    </div>
  );
}
