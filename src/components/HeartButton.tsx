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

  // Sent state: muted gray
  if (alreadySent) {
    return (
      <button
        disabled
        aria-label="White call already sent"
        className="h-9 px-4 rounded-full bg-sky-soft-100 text-sky-soft-400 cursor-default text-sm font-medium whitespace-nowrap"
      >
        Sent 🤍
      </button>
    );
  }

  // Active state: soft primary blue
  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || sending}
      aria-label="Send white call"
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      animate={justSent ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.2 }}
      className={`h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        disabled || sending
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : 'bg-blue-500/90 hover:bg-blue-500 text-white'
      }`}
    >
      {sending ? 'Sending...' : 'Send 🤍'}
    </motion.button>
  );
}
