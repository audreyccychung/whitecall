// Animated heart counter with bounce effect
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface HeartCounterAnimationProps {
  count: number;
  isOnCall: boolean;
}

export function HeartCounterAnimation({ count, isOnCall }: HeartCounterAnimationProps) {
  const [prevCount, setPrevCount] = useState(count);
  const [showIncrease, setShowIncrease] = useState(false);

  useEffect(() => {
    if (count > prevCount) {
      setShowIncrease(true);
      setTimeout(() => setShowIncrease(false), 1500);
    }
    setPrevCount(count);
  }, [count]);

  const increase = count - prevCount;

  // Generate message based on count and on-call status
  const getMessage = (): { line1: string; line2?: string } => {
    if (!isOnCall) {
      return {
        line1: "You're not on call today",
        line2: 'Want to support a friend?',
      };
    } else if (count === 0) {
      return {
        line1: "You're on call today 🤍",
        line2: 'Friends can send you white calls for support.',
      };
    } else if (count === 1) {
      return { line1: '1 friend is thinking of you today' };
    } else {
      return { line1: `${count} friends are thinking of you today` };
    }
  };

  const message = getMessage();

  return (
    <div className="relative inline-block">
      <motion.div
        key={count}
        initial={{ scale: 1 }}
        animate={{ scale: count > prevCount ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <div className="text-sm text-gray-800 max-w-[200px]">
          <div>{message.line1}</div>
          {message.line2 && <div>{message.line2}</div>}
        </div>
      </motion.div>

      {/* Increase indicator */}
      <AnimatePresence>
        {showIncrease && increase > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -30, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute -top-8 right-0 text-green-500 font-bold text-xl"
          >
            +{increase}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
