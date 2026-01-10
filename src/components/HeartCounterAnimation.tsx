// Animated heart counter with bounce effect
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface HeartCounterAnimationProps {
  count: number;
  label?: string;
}

export function HeartCounterAnimation({ count, label = 'white calls' }: HeartCounterAnimationProps) {
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

  return (
    <div className="relative inline-block">
      <motion.div
        key={count}
        initial={{ scale: 1 }}
        animate={{ scale: count > prevCount ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <div className="text-4xl font-bold text-gray-800">{count}</div>
        <div className="text-sm text-gray-600">{label}</div>
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
