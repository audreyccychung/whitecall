// Heart send button - icon-forward, pastel sky-blue palette
import { motion } from 'framer-motion';
import { useState } from 'react';

interface HeartButtonProps {
  onClick: () => Promise<void>;
  disabled?: boolean;
  alreadySent?: boolean;
}

export function HeartButton({ onClick, disabled = false, alreadySent = false }: HeartButtonProps) {
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState(false);

  const handleClick = async () => {
    if (disabled || sending || alreadySent) return;

    setSending(true);
    try {
      await onClick();
      setJustSent(true);
      setTimeout(() => setJustSent(false), 300);
    } finally {
      setSending(false);
    }
  };

  // Sent state: filled heart, muted colors
  if (alreadySent) {
    return (
      <button
        disabled
        aria-label="Heart already sent"
        className="w-11 h-11 flex items-center justify-center rounded-full bg-sky-soft-50 cursor-default"
      >
        <span className="text-xl text-sky-soft-300">💙</span>
      </button>
    );
  }

  // Active state: outline heart, interactive
  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || sending}
      aria-label="Send heart"
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.08 }}
      animate={justSent ? { scale: [1, 1.25, 1] } : {}}
      transition={{ duration: 0.25 }}
      className={`w-11 h-11 flex items-center justify-center rounded-full transition-colors ${
        disabled || sending
          ? 'bg-gray-100 cursor-not-allowed'
          : 'bg-sky-soft-100 hover:bg-sky-soft-200 shadow-sm hover:shadow-md'
      }`}
    >
      <span className={`text-xl ${disabled || sending ? 'text-gray-300' : 'text-sky-soft-500'}`}>
        {sending ? '🤍' : '💙'}
      </span>
    </motion.button>
  );
}
