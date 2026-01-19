// PWA Install Prompt - shows instructions for adding app to home screen
// Only displays on mobile browsers when app is not already installed

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DISMISSED_KEY = 'whitecall-install-dismissed';

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed
    if (localStorage.getItem(DISMISSED_KEY)) {
      return;
    }

    // Don't show if already installed as PWA (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);

    // Check if Android
    const isAndroid = /android/.test(userAgent);

    // Only show on mobile devices
    if (isIOSDevice || isAndroid) {
      setIsIOS(isIOSDevice && isSafari);
      // Delay showing to not interrupt initial load
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-20 left-4 right-4 z-50"
      >
        <div className="bg-white rounded-2xl shadow-soft-lg p-4 border border-gray-100">
          <div className="flex items-start gap-3">
            {/* App icon */}
            <div className="w-12 h-12 rounded-xl bg-sky-soft-500 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm">Add WhiteCall to Home Screen</h3>

              {isIOS ? (
                <p className="text-xs text-gray-500 mt-1">
                  Tap <span className="inline-flex items-center">
                    <svg className="w-4 h-4 mx-0.5 text-sky-soft-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </span> then "Add to Home Screen"
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Tap menu <span className="font-medium">⋮</span> then "Add to Home screen"
                </p>
              )}
            </div>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="p-1 text-gray-400 hover:text-gray-600 -mt-1 -mr-1"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
