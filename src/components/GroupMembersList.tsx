// Group members list component
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarDisplay } from './AvatarDisplay';
import { HeartButton } from './HeartButton';
import { formatCallDateBadge } from '../utils/date';
import type { GroupMember } from '../types/group';

interface GroupMembersListProps {
  members: GroupMember[];
  currentUserId: string | undefined;
  isOwner: boolean;
  onRemoveMember: (memberId: string) => Promise<{ success: boolean; error?: string }>;
  onSendHeart?: (memberId: string) => Promise<void>;
  sentHearts?: Set<string>; // IDs of members we've already sent hearts to today
  onMemberClick?: (member: GroupMember) => void; // Open profile modal
}

export function GroupMembersList({
  members,
  currentUserId,
  isOwner,
  onRemoveMember,
  onSendHeart,
  sentHearts = new Set(),
  onMemberClick,
}: GroupMembersListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRemove = async (memberId: string) => {
    setRemovingId(memberId);
    setError(null);

    const result = await onRemoveMember(memberId);

    setRemovingId(null);
    setExpandedId(null);

    if (!result.success) {
      setError(result.error ?? 'Failed to remove member');
      setTimeout(() => setError(null), 3000);
    }
  };

  const toggleExpand = (memberId: string) => {
    setExpandedId(expandedId === memberId ? null : memberId);
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-6xl mb-4">👤</p>
        <p className="text-gray-600">No members yet. Add some!</p>
      </div>
    );
  }

  // Separate on-call members from others
  const onCallMembers = members.filter((m) => m.is_on_call);
  const otherMembers = members.filter((m) => !m.is_on_call);

  const renderMemberCard = (member: GroupMember) => {
    const isCurrentUser = member.user_id === currentUserId;
    const canRemove = isOwner && !isCurrentUser;
    const canSendHeart = member.is_on_call && !isCurrentUser && onSendHeart;
    const alreadySent = sentHearts.has(member.user_id);
    const isExpanded = expandedId === member.user_id;

    // Handle click: profile modal for non-self, expand for owner remove action
    const handleCardClick = () => {
      if (!isCurrentUser && onMemberClick) {
        onMemberClick(member);
      } else if (canRemove) {
        toggleExpand(member.user_id);
      }
    };

    return (
      <div key={member.user_id} className="bg-white rounded-xl shadow-soft overflow-hidden">
        <div
          className={`flex items-center justify-between p-4 ${(!isCurrentUser || canRemove) ? 'cursor-pointer' : ''}`}
          onClick={handleCardClick}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* On-call indicator dot */}
            <div className="flex-shrink-0 w-2">
              {member.is_on_call && (
                <span className="block w-2 h-2 rounded-full bg-green-500" />
              )}
            </div>

            <AvatarDisplay
              avatarType={member.avatar_type}
              avatarColor={member.avatar_color}
              size="medium"
            />

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-base text-gray-800 truncate">
                {member.display_name || member.username}
                {isCurrentUser && (
                  <span className="ml-2 text-xs text-sky-soft-600">(you)</span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-400">@{member.username}</p>
                {/* Next call date badge (only for members not on call) */}
                {!member.is_on_call && member.next_call_date && (
                  <span className="text-xs text-gray-400">{formatCallDateBadge(member.next_call_date)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Heart button for on-call members */}
          {canSendHeart && (
            <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0 ml-2">
              <HeartButton
                onClick={() => onSendHeart(member.user_id)}
                alreadySent={alreadySent}
              />
            </div>
          )}

          {/* Expand indicator for removable members */}
          {canRemove && !member.is_on_call && (
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>

        {/* Expandable remove section */}
        <AnimatePresence>
          {isExpanded && canRemove && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-100 overflow-hidden"
            >
              <div className="p-3 flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(member.user_id);
                  }}
                  disabled={removingId === member.user_id}
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {removingId === member.user_id ? 'Removing...' : 'Remove from group'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      {/* On Call Today Section */}
      {onCallMembers.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
            On Call Today ({onCallMembers.length})
          </h3>
          <div className="space-y-2">
            {onCallMembers.map(renderMemberCard)}
          </div>
        </section>
      )}

      {/* Other Members Section */}
      {otherMembers.length > 0 && (
        <section>
          {onCallMembers.length > 0 && (
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
              Other Members ({otherMembers.length})
            </h3>
          )}
          <div className="space-y-2">
            {otherMembers.map(renderMemberCard)}
          </div>
        </section>
      )}
    </div>
  );
}
