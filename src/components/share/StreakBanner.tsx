import { motion } from 'framer-motion';
import { ShareButton } from './ShareButton';

interface StreakBannerProps {
  days: number;
  onShare: () => void;
}

export function StreakBanner({ days, onShare }: StreakBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 shadow-soft"
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">🔥</span>
        <span className="font-semibold text-gray-800">
          {days} day streak!
        </span>
      </div>
      <ShareButton onClick={onShare} />
    </motion.div>
  );
}
