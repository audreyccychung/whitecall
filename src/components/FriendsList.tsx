// Friends list component
import { AvatarDisplay } from './AvatarDisplay';
import { HeartButton } from './HeartButton';
import { formatCallDateBadge } from '../utils/date';
import type { Friend } from '../types/friend';

interface FriendsListProps {
  friends: Friend[];
  onSendHeart: (friendId: string) => Promise<void>;
  onFriendClick?: (friend: Friend) => void;
  showOnlyOnCall?: boolean;
}

export function FriendsList({ friends, onSendHeart, onFriendClick, showOnlyOnCall = false }: FriendsListProps) {
  // Filter friends who are on call (derived from active shifts)
  const filteredFriends = showOnlyOnCall
    ? friends.filter((f) => f.is_on_call)
    : friends;

  if (filteredFriends.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-6xl mb-4">😌</p>
        <p className="text-gray-600">
          {showOnlyOnCall
            ? 'No friends on call today. Enjoy the quiet day!'
            : 'No friends yet. Add some friends to send support!'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredFriends.map((friend) => (
        <div
          key={friend.id}
          onClick={() => onFriendClick?.(friend)}
          className={`flex items-center justify-between p-4 bg-white rounded-xl shadow-soft hover:shadow-soft-lg transition-shadow ${
            onFriendClick ? 'cursor-pointer' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <AvatarDisplay
              avatarType={friend.avatar_type}
              avatarColor={friend.avatar_color}
              size="medium"
            />
            <div>
              <p className="font-semibold text-base text-gray-800">
                {friend.display_name || friend.username}
              </p>
              <p className="text-xs text-gray-400">@{friend.username}</p>
              {friend.next_call_date && (
                <span
                  className={`inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full ${
                    friend.is_on_call
                      ? 'bg-green-50 text-green-600'
                      : 'bg-sky-50 text-sky-600'
                  }`}
                >
                  {formatCallDateBadge(friend.next_call_date)}
                </span>
              )}
            </div>
          </div>

          {friend.is_on_call && (
            <HeartButton
              onClick={() => onSendHeart(friend.id)}
              alreadySent={!friend.can_send_heart}
            />
          )}
        </div>
      ))}
    </div>
  );
}
