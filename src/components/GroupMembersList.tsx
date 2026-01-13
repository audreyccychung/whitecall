// Group members list component
import { useState } from 'react';
import { motion } from 'framer-motion';
import { AvatarDisplay } from './AvatarDisplay';
import type { GroupMember } from '../types/group';

interface GroupMembersListProps {
  members: GroupMember[];
  currentUserId: string | undefined;
  isOwner: boolean;
  onRemoveMember: (memberId: string) => Promise<{ success: boolean; error?: string }>;
}

export function GroupMembersList({
  members,
  currentUserId,
  isOwner,
  onRemoveMember,
}: GroupMembersListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRemove = async (memberId: string) => {
    setRemovingId(memberId);
    setError(null);

    const result = await onRemoveMember(memberId);

    setRemovingId(null);

    if (!result.success) {
      setError(result.error ?? 'Failed to remove member');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-6xl mb-4">👤</p>
        <p className="text-gray-600">No members yet. Add some!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      {members.map((member) => {
        const isCurrentUser = member.user_id === currentUserId;
        const canRemove = isOwner && !isCurrentUser;

        return (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 bg-white rounded-xl shadow-soft"
          >
            <div className="flex items-center gap-3">
              <AvatarDisplay
                avatarType={member.avatar_type}
                avatarColor={member.avatar_color}
                size="medium"
              />
              <div>
                <p className="font-semibold text-base text-gray-800">
                  {member.display_name || member.username}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs text-sky-soft-600">(you)</span>
                  )}
                </p>
                <p className="text-xs text-gray-400">@{member.username}</p>
              </div>
            </div>

            {canRemove && (
              <button
                onClick={() => handleRemove(member.user_id)}
                disabled={removingId === member.user_id}
                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {removingId === member.user_id ? 'Removing...' : 'Remove'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
