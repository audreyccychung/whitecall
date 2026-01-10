// Streak display component
import { motion } from 'framer-motion';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  className?: string;
}

export function StreakDisplay({ currentStreak, longestStreak, className = '' }: StreakDisplayProps) {
  if (currentStreak === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`bg-gradient-to-r from-orange-400 to-red-500 text-white px-6 py-3 rounded-full shadow-lg ${className}`}
    >
      <div className="flex items-center gap-2">
        <motion.span
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="text-2xl"
        >
          🔥
        </motion.span>
        <div className="flex flex-col">
          <span className="text-lg font-bold">{currentStreak}-day streak!</span>
          {longestStreak > currentStreak && (
            <span className="text-xs opacity-90">Best: {longestStreak} days</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
