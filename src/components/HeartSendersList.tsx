// Compact list of who sent hearts - avatars with progressive disclosure
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarDisplay } from './AvatarDisplay';
import type { HeartWithSender } from '../types/heart';

interface HeartSendersListProps {
  hearts: HeartWithSender[];
  maxVisible?: number;
}

// Soft haptic feedback
const softHaptic = () => {
  if (navigator.vibrate) {
    navigator.vibrate(10); // Very short, soft vibration
  }
};

export function HeartSendersList({ hearts, maxVisible = 5 }: HeartSendersListProps) {
  const [expanded, setExpanded] = useState(false);
  const [tappedAvatarId, setTappedAvatarId] = useState<string | null>(null);
  const [floatingHearts, setFloatingHearts] = useState<number[]>([]);

  if (hearts.length === 0) return null;

  const visibleHearts = hearts.slice(0, maxVisible);
  const remainingCount = hearts.length - maxVisible;

  // Tap anywhere to expand - triggers haptic and floating hearts
  const handleExpand = () => {
    softHaptic();

    // Add floating hearts animation
    const newHearts = Array.from({ length: 3 }, (_, i) => Date.now() + i);
    setFloatingHearts(newHearts);
    setTimeout(() => setFloatingHearts([]), 2000);

    setExpanded(!expanded);
  };

  // Tap individual avatar - just a fun bounce, nothing else
  const handleAvatarTap = (e: React.MouseEvent, heartId: string) => {
    e.stopPropagation();
    softHaptic();
    setTappedAvatarId(heartId);
    setTimeout(() => setTappedAvatarId(null), 300);
  };

  return (
    <div className="mt-3 relative">
      {/* Floating hearts on tap */}
      <AnimatePresence>
        {floatingHearts.map((id, index) => (
          <motion.div
            key={id}
            initial={{ opacity: 1, y: 0, x: (index - 1) * 20 }}
            animate={{ opacity: 0, y: -40 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute left-1/2 -translate-x-1/2 text-xl pointer-events-none"
          >
            🤍
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Avatars row - tap to expand */}
      <button
        onClick={handleExpand}
        className="flex items-center justify-center gap-1 mx-auto"
      >
        {visibleHearts.map((heart) => (
          <motion.div
            key={heart.id}
            className="relative cursor-pointer"
            animate={tappedAvatarId === heart.id ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
            onClick={(e) => handleAvatarTap(e, heart.id)}
            whileTap={{ scale: 0.95 }}
          >
            <AvatarDisplay
              avatarType={heart.sender_avatar_type}
              avatarColor={heart.sender_avatar_color}
              size="small"
            />
            {/* Glow effect on tap */}
            <AnimatePresence>
              {tappedAvatarId === heart.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1.1 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 rounded-full bg-white/50 pointer-events-none"
                />
              )}
            </AnimatePresence>
          </motion.div>
        ))}
        {remainingCount > 0 && (
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-sm text-gray-500 font-medium">
            +{remainingCount}
          </div>
        )}
      </button>

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
