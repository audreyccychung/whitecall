// Friends list component - unified view with on-call friends prioritized
import { AvatarDisplay } from './AvatarDisplay';
import { HeartButton } from './HeartButton';
import { formatCallDateBadge } from '../utils/date';
import type { Friend } from '../types/friend';

interface FriendsListProps {
  friends: Friend[];
  onSendHeart: (friendId: string) => Promise<void>;
  onFriendClick?: (friend: Friend) => void;
}

function FriendCard({
  friend,
  onSendHeart,
  onFriendClick,
}: {
  friend: Friend;
  onSendHeart: (friendId: string) => Promise<void>;
  onFriendClick?: (friend: Friend) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-white rounded-xl hover:bg-gray-50 transition-colors">
      <div
        onClick={() => onFriendClick?.(friend)}
        className={`flex items-center gap-3 flex-1 min-w-0 ${onFriendClick ? 'cursor-pointer' : ''}`}
      >
        {/* On-call indicator dot */}
        <div className="flex-shrink-0 w-2">
          {friend.is_on_call && (
            <span className="block w-2 h-2 rounded-full bg-green-500" />
          )}
        </div>

        <AvatarDisplay
          avatarType={friend.avatar_type}
          avatarColor={friend.avatar_color}
          size="medium"
        />

        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-800 truncate">
            {friend.display_name || friend.username}
          </p>
          <p className="text-xs text-gray-400 truncate">@{friend.username}</p>
        </div>
      </div>

      {/* Show heart button only for on-call friends */}
      {friend.is_on_call && (
        <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0 ml-2">
          <HeartButton
            onClick={() => onSendHeart(friend.id)}
            alreadySent={!friend.can_send_heart}
          />
        </div>
      )}

      {/* Show next call date for non-on-call friends */}
      {!friend.is_on_call && friend.next_call_date && (
        <span className="flex-shrink-0 ml-2 text-xs text-gray-400">
          {formatCallDateBadge(friend.next_call_date)}
        </span>
      )}
    </div>
  );
}

export function FriendsList({ friends, onSendHeart, onFriendClick }: FriendsListProps) {
  // Separate friends into on-call and others
  const onCallFriends = friends.filter((f) => f.is_on_call);
  const otherFriends = friends.filter((f) => !f.is_on_call);

  // Empty state
  if (friends.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <p className="text-4xl mb-3">👋</p>
        <p className="text-gray-500">No friends yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Tap + to add a friend by username
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* On Call Today Section */}
      <section>
        <div className="mb-2 px-1">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            On Call Today {onCallFriends.length > 0 && `(${onCallFriends.length})`}
          </h3>
          {onCallFriends.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">Wish them a white call 🤍</p>
          )}
        </div>
        {onCallFriends.length === 0 ? (
          <div className="py-4 px-4 bg-white rounded-xl">
            <p className="text-sm text-gray-400">No friends on call today</p>
          </div>
        ) : (
          <div className="space-y-1">
            {onCallFriends.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                onSendHeart={onSendHeart}
                onFriendClick={onFriendClick}
              />
            ))}
          </div>
        )}
      </section>

      {/* All Friends Section */}
      {otherFriends.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
            All Friends ({otherFriends.length})
          </h3>
          <div className="space-y-1">
            {otherFriends.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                onSendHeart={onSendHeart}
                onFriendClick={onFriendClick}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
