// Groups management page
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useGroups } from '../hooks/useGroups';
import { CreateGroupForm } from '../components/CreateGroupForm';
import { GroupCard } from '../components/GroupCard';

export default function GroupsPage() {
  const { user } = useAuth();
  const { groups, loading, createGroup } = useGroups(user?.id);

  const handleCreateGroup = async (name: string) => {
    return createGroup(name);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-soft-50 to-white-call-100">
      {/* Header */}
      <header className="bg-white shadow-soft">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/home"
              className="text-gray-600 hover:text-gray-800 font-semibold text-sm sm:text-base transition-colors"
            >
              ← Back
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Groups</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Create Group */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-soft-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Group</h2>
          <CreateGroupForm onCreateGroup={handleCreateGroup} />
        </motion.div>

        {/* Groups List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-soft-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Your Groups ({groups.length})</h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-sky-soft-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-600">Loading groups...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-6xl mb-4">👥</p>
              <p className="text-gray-600">No groups yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
