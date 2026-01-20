// Group detail page - view and manage a single group
import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useGroups } from '../hooks/useGroups';
import { useGroupMembers } from '../hooks/useGroupMembers';
import { useHearts } from '../hooks/useHearts';
import { useGroupInvite } from '../hooks/useGroupInvite';
import { useFriends } from '../hooks/useFriends';
import { GroupMembersList } from '../components/GroupMembersList';
import { AddMemberForm } from '../components/AddMemberForm';
import { GroupCalendarView } from '../components/GroupCalendarView';
import { FriendProfileModal } from '../components/FriendProfileModal';
import type { GroupMemberOnCall } from '../types/group';
import type { Friend } from '../types/friend';

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups, deleteGroup } = useGroups(user?.id);
  const { members, loading: membersLoading, addMember, removeMember, leaveGroup } = useGroupMembers(id);
  const { sendHeart, heartsSent } = useHearts(user?.id);
  const { generateInviteCode, buildInviteUrl, isGenerating } = useGroupInvite();
  const { friends, addFriend } = useFriends(user?.id);

  const [deleting, setDeleting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Friend | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  // Track which members we've sent hearts to (for optimistic UI)
  const [sentHeartsLocal, setSentHeartsLocal] = useState<Set<string>>(new Set());

  // Find the current group from loaded groups
  const group = groups.find((g) => g.id === id);
  const isOwner = group?.is_owner ?? false;

  const handleAddMember = async (username: string) => {
    return addMember(username);
  };

  const handleGenerateInviteLink = async () => {
    if (!id) return;

    setInviteError(null);
    setInviteCopied(false);

    const result = await generateInviteCode(id);

    if (result.success && result.inviteCode) {
      const url = buildInviteUrl(result.inviteCode);
      setInviteLink(url);
    } else {
      setInviteError(result.message);
    }
  };

  const handleCopyInviteLink = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      setInviteError('Could not copy. Try selecting and copying manually.');
    }
  };

  const handleShareInviteLink = async () => {
    if (!inviteLink || !group) return;

    // Use Web Share API if available (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${group.name} on WhiteCall`,
          text: `Join my group "${group.name}" on WhiteCall!`,
          url: inviteLink,
        });
      } catch {
        // User cancelled or share failed, ignore
      }
    } else {
      // Fallback to copy
      handleCopyInviteLink();
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    return removeMember(memberId);
  };

  const handleSendHeart = async (memberId: string) => {
    // Optimistic update - show as sent immediately
    setSentHeartsLocal((prev) => new Set(prev).add(memberId));

    const result = await sendHeart(memberId);

    if (!result.success) {
      // Rollback on failure
      setSentHeartsLocal((prev) => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
    }
  };

  // Combine hearts from backend (heartsSent) with local optimistic updates
  const sentHeartsSet = new Set([
    ...heartsSent.map((h) => h.recipient_id),
    ...sentHeartsLocal,
  ]);

  // Convert GroupMemberOnCall to Friend for profile modal
  const handleMemberClick = (member: GroupMemberOnCall) => {
    const friendLike: Friend = {
      id: member.user_id,
      username: member.username,
      display_name: member.display_name,
      avatar_type: member.avatar_type,
      avatar_color: member.avatar_color,
      friendship_id: '', // Not used by modal, placeholder
    };
    setSelectedMember(friendLike);
  };

  const handleDeleteGroup = async () => {
    if (!id) return;

    setDeleting(true);
    setDeleteError(null);

    const result = await deleteGroup(id);

    if (result.success) {
      navigate('/groups');
    } else {
      setDeleting(false);
      setDeleteError(result.error ?? 'Failed to delete group');
      setShowDeleteConfirm(false);
    }
  };

  const handleLeaveGroup = async () => {
    setLeaving(true);
    setLeaveError(null);

    const result = await leaveGroup();

    if (result.success) {
      navigate('/groups');
    } else {
      setLeaving(false);
      setLeaveError(result.error ?? 'Failed to leave group');
      setShowLeaveConfirm(false);
    }
  };

  // Loading state while groups are being fetched
  if (!group && groups.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-soft-50 to-white-call-100">
        <header className="bg-white shadow-soft">
          <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
            <Link
              to="/groups"
              className="text-gray-600 hover:text-gray-800 font-semibold text-sm sm:text-base transition-colors"
            >
              ← Back
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Loading...</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-sky-soft-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-600">Loading group...</p>
          </div>
        </main>
      </div>
    );
  }

  // Group not found
  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-soft-50 to-white-call-100">
        <header className="bg-white shadow-soft">
          <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
            <Link
              to="/groups"
              className="text-gray-600 hover:text-gray-800 font-semibold text-sm sm:text-base transition-colors"
            >
              ← Back
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Group Not Found</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-6xl mb-4">🔍</p>
            <p className="text-gray-600">This group doesn't exist or you don't have access to it.</p>
            <Link
              to="/groups"
              className="inline-block mt-4 px-6 py-2 bg-sky-soft-500 text-white rounded-lg font-medium hover:bg-sky-soft-600 transition-colors"
            >
              Back to Groups
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-soft-50 to-white-call-100">
      {/* Header */}
      <header className="bg-white shadow-soft">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/groups"
              className="text-gray-600 hover:text-gray-800 font-semibold text-sm sm:text-base transition-colors"
            >
              ← Back
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{group.name}</h1>
          </div>
          {isOwner && (
            <span className="text-xs sm:text-sm text-sky-soft-600 font-medium">Owner</span>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Group Schedule Calendar */}
        {id && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-soft-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Group Schedule</h2>
            <GroupCalendarView groupId={id} onMemberClick={handleMemberClick} />
          </motion.div>
        )}

        {/* Add Member (owner only) */}
        {isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-soft-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-1">Add members</h2>
            <p className="text-sm text-gray-500 mb-4">Invite friends to this group</p>

            {/* Invite Link Section */}
            <div className="mb-6 p-4 bg-sky-soft-50 rounded-xl border border-sky-soft-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🔗</span>
                <span className="font-medium text-gray-800">Share invite link</span>
              </div>

              {inviteError && (
                <p className="text-sm text-red-600 mb-2">{inviteError}</p>
              )}

              {!inviteLink ? (
                <button
                  onClick={handleGenerateInviteLink}
                  disabled={isGenerating}
                  className="w-full py-2.5 bg-sky-soft-500 text-white rounded-lg font-medium hover:bg-sky-soft-600 disabled:opacity-50 transition-colors"
                >
                  {isGenerating ? 'Creating link...' : 'Create invite link'}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 truncate"
                    />
                    <button
                      onClick={handleCopyInviteLink}
                      className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      {inviteCopied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <button
                    onClick={handleShareInviteLink}
                    className="w-full py-2.5 bg-sky-soft-500 text-white rounded-lg font-medium hover:bg-sky-soft-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>📤</span> Share link
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    Link expires in 7 days
                  </p>
                </div>
              )}
            </div>

            {/* Or divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 uppercase">or add by username</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <AddMemberForm onAddMember={handleAddMember} />
            <p className="text-xs text-gray-500 mt-3">
              {members.length}/20 members
            </p>
          </motion.div>
        )}

        {/* Members List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-soft-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Members ({members.length})
          </h2>

          {membersLoading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-sky-soft-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-600">Loading members...</p>
            </div>
          ) : (
            <GroupMembersList
              members={members}
              currentUserId={user?.id}
              isOwner={isOwner}
              onRemoveMember={handleRemoveMember}
              onSendHeart={handleSendHeart}
              sentHearts={sentHeartsSet}
            />
          )}
        </motion.div>

        {/* Leave Group (non-owner only) */}
        {!isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-soft-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Leave Group</h2>

            {leaveError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg mb-4"
              >
                {leaveError}
              </motion.div>
            )}

            {!showLeaveConfirm ? (
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Leave Group
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Are you sure you want to leave this group?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleLeaveGroup}
                    disabled={leaving}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    {leaving ? 'Leaving...' : 'Yes, Leave'}
                  </button>
                  <button
                    onClick={() => setShowLeaveConfirm(false)}
                    disabled={leaving}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Delete Group (owner only) */}
        {isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-soft-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Danger Zone</h2>

            {deleteError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg mb-4"
              >
                {deleteError}
              </motion.div>
            )}

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                Delete Group
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Are you sure? This will permanently delete the group and remove all members.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteGroup}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {deleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Member profile modal */}
      <FriendProfileModal
        friend={selectedMember}
        onClose={() => setSelectedMember(null)}
        // Show "Add Friend" button if member is not self and not already a friend
        showAddFriend={
          selectedMember !== null &&
          selectedMember.id !== user?.id &&
          !friends.some((f) => f.id === selectedMember.id)
        }
        onAddFriend={async (username) => {
          const result = await addFriend(username);
          return { success: result.success, error: result.error };
        }}
      />
    </div>
  );
}
