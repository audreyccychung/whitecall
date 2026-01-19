// Animated heart display around avatar with Framer Motion
import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface HeartDisplayProps {
  count: number;
  maxVisible?: number;
  pulse?: boolean; // Trigger a pulse animation
}

export function HeartDisplay({ count, maxVisible = 20, pulse = false }: HeartDisplayProps) {
  // Generate random positions for hearts in a circle around the avatar
  const hearts = useMemo(() => {
    const visibleCount = Math.min(count, maxVisible);
    const positions: { x: number; y: number; delay: number; scale: number }[] = [];

    for (let i = 0; i < visibleCount; i++) {
      const angle = (i / visibleCount) * Math.PI * 2;
      const radius = 60 + Math.random() * 20; // Random radius for organic feel
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      positions.push({
        x,
        y,
        delay: i * 0.05,
        scale: 0.8 + Math.random() * 0.4, // Random scale 0.8-1.2
      });
    }

    return positions;
  }, [count, maxVisible]);

  if (count === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {hearts.map((heart, index) => (
        <motion.div
          key={index}
          className="absolute text-2xl"
          style={{
            left: '50%',
            top: '50%',
          }}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: 1,
            scale: pulse ? [heart.scale, heart.scale * 1.3, heart.scale] : heart.scale,
            x: heart.x,
            y: pulse ? [heart.y, heart.y - 10, heart.y] : heart.y,
          }}
          transition={{
            duration: pulse ? 0.5 : 0.6,
            delay: pulse ? index * 0.05 : heart.delay,
            ease: 'easeOut',
          }}
        >
          <motion.span
            animate={{
              y: [0, -15, -30, -15, 0],
              opacity: [1, 0.9, 0.7, 0.9, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: index * 0.3,
            }}
          >
            🤍
          </motion.span>
        </motion.div>
      ))}
    </div>
  );
}
