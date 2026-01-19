// Compact list of who sent hearts - just small avatars in a row
import { AvatarDisplay } from './AvatarDisplay';
import type { HeartWithSender } from '../types/heart';

interface HeartSendersListProps {
  hearts: HeartWithSender[];
  maxVisible?: number;
}

export function HeartSendersList({ hearts, maxVisible = 5 }: HeartSendersListProps) {
  if (hearts.length === 0) return null;

  const visibleHearts = hearts.slice(0, maxVisible);
  const remainingCount = hearts.length - maxVisible;

  return (
    <div className="mt-3 flex items-center justify-center gap-1">
      {visibleHearts.map((heart) => (
        <div
          key={heart.id}
          className="relative"
          title={heart.sender_display_name || heart.sender_username}
        >
          <AvatarDisplay
            avatarType={heart.sender_avatar_type}
            avatarColor={heart.sender_avatar_color}
            size="small"
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-sm text-gray-500 font-medium">
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
