// Heart send button - text button with sky blue background
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

  // Sent state: muted appearance
  if (alreadySent) {
    return (
      <button
        disabled
        aria-label="White call already sent"
        className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-sky-soft-100 text-sky-soft-400 cursor-default text-xs sm:text-sm font-semibold"
      >
        Sent 🤍
      </button>
    );
  }

  // Active state: sky blue background, white text
  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || sending}
      aria-label="Send white call"
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      animate={justSent ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.2 }}
      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
        disabled || sending
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : 'bg-sky-soft-500 hover:bg-sky-soft-600 text-white shadow-sm hover:shadow-md'
      }`}
    >
      {sending ? 'Sending...' : 'Send white call 🤍'}
    </motion.button>
  );
}
