// Heart send button with animation
import { motion } from 'framer-motion';
import { useState } from 'react';

interface HeartButtonProps {
  onClick: () => Promise<void>;
  disabled?: boolean;
  alreadySent?: boolean;
}

export function HeartButton({ onClick, disabled = false, alreadySent = false }: HeartButtonProps) {
  const [sending, setSending] = useState(false);

  const handleClick = async () => {
    if (disabled || sending || alreadySent) return;

    setSending(true);
    try {
      await onClick();
    } finally {
      setSending(false);
    }
  };

  if (alreadySent) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
      >
        Sent 🤍
      </button>
    );
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || sending}
      whileTap={{ scale: 0.95 }}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        disabled || sending
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : 'bg-sky-soft-500 text-white hover:bg-sky-soft-600 shadow-soft'
      }`}
    >
      {sending ? 'Sending...' : 'Send 🤍'}
    </motion.button>
  );
}
