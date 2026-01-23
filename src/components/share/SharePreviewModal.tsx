import { motion, AnimatePresence } from 'framer-motion';

interface SharePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: () => void;
  isGenerating: boolean;
  children: React.ReactNode;
}

/**
 * Modal that shows a preview of the share card (scaled down)
 * before the user confirms sharing
 */
export function SharePreviewModal({
  isOpen,
  onClose,
  onShare,
  isGenerating,
  children,
}: SharePreviewModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-sm"
          >
            <div className="bg-white rounded-3xl p-6 shadow-xl">
              {/* Preview - scaled down card */}
              <div className="mb-6">
                <div
                  className="relative mx-auto overflow-hidden rounded-2xl shadow-lg"
                  style={{
                    width: '200px',
                    height: '356px', // 1080:1920 ratio
                  }}
                >
                  {/* Scaled preview container */}
                  <div
                    style={{
                      transform: 'scale(0.185)',
                      transformOrigin: 'top left',
                      width: '1080px',
                      height: '1920px',
                    }}
                  >
                    {children}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-gray-100
                           text-gray-700 font-medium transition-colors
                           hover:bg-gray-200 active:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={onShare}
                  disabled={isGenerating}
                  className="flex-1 py-3 px-4 rounded-xl bg-sky-500
                           text-white font-medium transition-colors
                           hover:bg-sky-600 active:bg-sky-700
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating...' : 'Share'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
