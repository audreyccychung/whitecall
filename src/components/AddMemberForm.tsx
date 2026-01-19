// Add member to group form component
import { useState } from 'react';
import { motion } from 'framer-motion';

interface AddMemberFormProps {
  onAddMember: (username: string) => Promise<{ success: boolean; code: string; error?: string }>;
}

export function AddMemberForm({ onAddMember }: AddMemberFormProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await onAddMember(username.trim());

    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setUsername('');
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error ?? null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="member-username" className="block text-sm font-medium text-gray-700 mb-1">
          Add a friend
        </label>
        <p className="text-xs text-gray-500 mb-2">Invite someone to this group</p>
        <div className="flex gap-2">
          <input
            type="text"
            id="member-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-soft-500 focus:border-transparent outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="px-6 py-2 bg-sky-soft-500 text-white rounded-lg font-medium hover:bg-sky-soft-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg"
        >
          Member added successfully!
        </motion.div>
      )}
    </form>
  );
}
