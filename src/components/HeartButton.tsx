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
        className="flex items-center gap-2 px-4 py-2.5 bg-gray-400 text-white rounded-xl text-base font-medium cursor-not-allowed"
      >
        <span className="text-xl">🤍</span>
        <span>Sent</span>
      </button>
    );
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || sending}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-base font-medium transition-all ${
        disabled || sending
          ? 'bg-gray-400 text-white cursor-not-allowed'
          : 'bg-pink-500 text-white hover:bg-pink-600 shadow-md hover:shadow-lg'
      }`}
    >
      <span className="text-xl">🤍</span>
      <span>{sending ? 'Sending...' : 'Send'}</span>
    </motion.button>
  );
}
