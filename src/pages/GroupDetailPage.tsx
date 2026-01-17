// Group detail page - view and manage a single group
import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useGroups } from '../hooks/useGroups';
import { useGroupMembers } from '../hooks/useGroupMembers';
import { GroupMembersList } from '../components/GroupMembersList';
import { AddMemberForm } from '../components/AddMemberForm';
import { GroupCalendarView } from '../components/GroupCalendarView';

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups, deleteGroup } = useGroups(user?.id);
  const { members, loading: membersLoading, addMember, removeMember } = useGroupMembers(id);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Find the current group from loaded groups
  const group = groups.find((g) => g.id === id);
  const isOwner = group?.is_owner ?? false;

  const handleAddMember = async (username: string) => {
    return addMember(username);
  };

  const handleRemoveMember = async (memberId: string) => {
    return removeMember(memberId);
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
            <GroupCalendarView groupId={id} />
          </motion.div>
        )}

        {/* Add Member (owner only) */}
        {isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-soft-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Add Member</h2>
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
            />
          )}
        </motion.div>

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
    </div>
  );
}
