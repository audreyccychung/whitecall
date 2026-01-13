// Create group form component
import { useState } from 'react';
import { motion } from 'framer-motion';

interface CreateGroupFormProps {
  onCreateGroup: (name: string) => Promise<{ success: boolean; code: string; error?: string }>;
}

export function CreateGroupForm({ onCreateGroup }: CreateGroupFormProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await onCreateGroup(name.trim());

    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setName('');
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error ?? null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="group-name" className="block text-sm font-medium text-gray-700 mb-2">
          Group Name
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter group name (3-30 characters)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-soft-500 focus:border-transparent outline-none"
            disabled={loading}
            maxLength={30}
          />
          <button
            type="submit"
            disabled={loading || !name.trim() || name.trim().length < 3}
            className="px-6 py-2 bg-sky-soft-500 text-white rounded-lg font-medium hover:bg-sky-soft-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">{name.trim().length}/30 characters</p>
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
          Group created successfully!
        </motion.div>
      )}
    </form>
  );
}
