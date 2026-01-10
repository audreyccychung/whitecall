// Onboarding tutorial modal with confetti
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../lib/store';
import { celebrateOnboarding } from '../utils/confetti';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const steps = [
  {
    title: "Welcome to WhiteCall! 🤍",
    description:
      "WhiteCall is here to support you through call shifts. Send white hearts to friends who are on call to let them know you're thinking of them!",
    emoji: "🤍",
  },
  {
    title: "Add Friends",
    description:
      "Start by adding colleagues and friends. You can send hearts to anyone who's on call.",
    emoji: "👥",
  },
  {
    title: "Send Your First White Call",
    description:
      "When your friends toggle 'I'm on call today', you'll see them in your feed. Send them a heart to brighten their shift!",
    emoji: "💝",
  },
  {
    title: "Build Your Streak",
    description:
      "Send hearts daily to build your streak and become the most supportive colleague! Ready to get started?",
    emoji: "🔥",
  },
];

export function OnboardingModal({ isOpen, onClose, userId }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { completeOnboarding } = useStore();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    // Update database
    await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', userId);

    // Update store and close
    completeOnboarding();

    // Celebrate!
    celebrateOnboarding();

    onClose();
  };

  const currentStepData = steps[currentStep];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              {/* Progress dots */}
              <div className="flex justify-center gap-2 mb-6">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all ${
                      index === currentStep
                        ? 'w-8 bg-sky-soft-500'
                        : index < currentStep
                        ? 'w-2 bg-sky-soft-300'
                        : 'w-2 bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              {/* Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <div className="text-7xl mb-6">{currentStepData.emoji}</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    {currentStepData.title}
                  </h2>
                  <p className="text-gray-600 leading-relaxed mb-8">
                    {currentStepData.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Actions */}
              <div className="flex gap-3">
                {currentStep > 0 && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className={`px-6 py-3 bg-sky-soft-500 text-white rounded-xl font-medium hover:bg-sky-soft-600 transition-colors ${
                    currentStep === 0 ? 'w-full' : 'flex-1'
                  }`}
                >
                  {currentStep === steps.length - 1 ? "Let's Go!" : 'Next'}
                </button>
              </div>

              {/* Skip button */}
              <button
                onClick={handleComplete}
                className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip tutorial
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
