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
  const getMessage = () => {
    if (!isOnCall) {
      return "You're not on call today, yay! Wish a friend white call";
    } else if (count === 0) {
      return 'No friends have wished you a white call yet, remind them now!';
    } else if (count === 1) {
      return '1 friend wished you a white call today!';
    } else {
      return `${count} friends wished you a white call today!`;
    }
  };

  return (
    <div className="relative inline-block">
      <motion.div
        key={count}
        initial={{ scale: 1 }}
        animate={{ scale: count > prevCount ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        {isOnCall && <div className="text-4xl font-bold text-gray-800 mb-1">{count}</div>}
        <div className="text-sm text-gray-600 max-w-[200px]">{getMessage()}</div>
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
