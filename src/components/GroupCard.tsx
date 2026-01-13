// Group card component for list display
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Group } from '../types/group';

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    <Link to={`/groups/${group.id}`}>
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="flex items-center justify-between p-4 bg-white rounded-xl shadow-soft hover:shadow-soft-lg transition-shadow cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-sky-soft-100 flex items-center justify-center">
            <span className="text-xl">👥</span>
          </div>
          <div>
            <p className="font-semibold text-base text-gray-800">{group.name}</p>
            <p className="text-xs text-gray-500">
              {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
              {group.is_owner && <span className="ml-2 text-sky-soft-600">• Owner</span>}
            </p>
          </div>
        </div>
        <span className="text-gray-400">→</span>
      </motion.div>
    </Link>
  );
}
