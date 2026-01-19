// Compact list of who sent hearts - avatars with progressive disclosure
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarDisplay } from './AvatarDisplay';
import type { HeartWithSender } from '../types/heart';

interface HeartSendersListProps {
  hearts: HeartWithSender[];
  maxVisible?: number;
  onTap?: () => void; // Callback when tapped (to trigger heart animation)
}

// Soft haptic feedback
const softHaptic = () => {
  if (navigator.vibrate) {
    navigator.vibrate(10);
  }
};

export function HeartSendersList({ hearts, maxVisible = 5, onTap }: HeartSendersListProps) {
  const [expanded, setExpanded] = useState(false);

  if (hearts.length === 0) return null;

  const visibleHearts = hearts.slice(0, maxVisible);
  const remainingCount = hearts.length - maxVisible;

  // Tap to expand - triggers haptic and heart pulse
  const handleTap = () => {
    softHaptic();
    onTap?.(); // Trigger avatar hearts animation
    setExpanded(!expanded);
  };

  return (
    <div className="mt-3 relative">
      {/* Avatars row - tap to expand */}
      <motion.button
        onClick={handleTap}
        whileTap={{ scale: 0.95 }}
        className="flex items-center justify-center gap-1 mx-auto"
      >
        {visibleHearts.map((heart) => (
          <div key={heart.id}>
            <AvatarDisplay
              avatarType={heart.sender_avatar_type}
              avatarColor={heart.sender_avatar_color}
              size="small"
            />
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-sm text-gray-500 font-medium">
            +{remainingCount}
          </div>
        )}
      </motion.button>

      {/* Expanded names list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-1 text-center">
              {hearts.map((heart) => (
                <p key={heart.id} className="text-sm text-gray-600">
                  {heart.sender_display_name || heart.sender_username}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
