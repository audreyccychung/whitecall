// Day detail modal - bottom sheet showing who's on call for a specific day
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarDisplay } from './AvatarDisplay';
import type { GroupCalendarDay, GroupMemberOnCall } from '../types/group';

interface DayDetailModalProps {
  day: GroupCalendarDay | null;
  onClose: () => void;
  onMemberClick: (member: GroupMemberOnCall) => void;
}

// Format date for header (e.g., "Mon, Jan 20")
function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function DayDetailModal({ day, onClose, onMemberClick }: DayDetailModalProps) {
  return (
    <AnimatePresence>
      {day && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[80vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-light"
              aria-label="Close"
            >
              &times;
            </button>

            {/* Content */}
            <div className="px-6 pb-8 pt-2">
              {/* Date header */}
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {formatDateHeader(day.date)}
              </h2>

              {day.isFree ? (
                // Free day celebration
                <div className="py-8 text-center">
                  <span className="text-4xl mb-3 block">✓</span>
                  <p className="text-lg font-medium text-green-600 mb-1">
                    Everyone's free!
                  </p>
                  <p className="text-sm text-gray-500">
                    No one is on call this day.
                  </p>
                </div>
              ) : (
                // Members on call list
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                    On Call ({day.membersOnCall.length})
                  </h3>

                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {day.membersOnCall.map((member) => (
                      <button
                        key={member.user_id}
                        onClick={() => onMemberClick(member)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <AvatarDisplay
                          avatarType={member.avatar_type}
                          avatarColor={member.avatar_color}
                          size="small"
                        />
                        <div>
                          <p className="font-medium text-gray-800">
                            {member.display_name || member.username}
                          </p>
                          <p className="text-sm text-gray-500">@{member.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
