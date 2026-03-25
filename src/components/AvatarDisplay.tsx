// Reusable avatar display component
import { useState } from 'react';
import { getAvatarEmoji } from '../types/avatar';

interface AvatarDisplayProps {
  avatarType: string;
  avatarColor: string;
  avatarUrl?: string | null;
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xl';
  className?: string;
}

const sizeClasses = {
  tiny: 'w-6 h-6 text-xs',
  small: 'w-12 h-12 text-2xl',
  medium: 'w-16 h-16 text-4xl',
  large: 'w-24 h-24 text-6xl',
  xl: 'w-32 h-32 text-8xl',
};

export function AvatarDisplay({
  avatarType,
  avatarColor,
  avatarUrl,
  size = 'medium',
  className = '',
}: AvatarDisplayProps) {
  const [imgError, setImgError] = useState(false);
  const emoji = getAvatarEmoji(avatarType as any);

  // Show photo if available and not broken
  if (avatarUrl && !imgError) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 ${className}`}
      >
        <img
          src={avatarUrl}
          alt="Profile photo"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallback: emoji avatar
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${className}`}
      style={{ backgroundColor: avatarColor }}
    >
      <span className="select-none">{emoji}</span>
    </div>
  );
}
