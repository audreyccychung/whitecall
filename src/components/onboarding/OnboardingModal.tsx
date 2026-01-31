// Onboarding modal - 4-step introduction for new users
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WelcomeStep } from './steps/WelcomeStep';
import { CallsStep } from './steps/CallsStep';
import { FriendsStep } from './steps/FriendsStep';
import { GroupsStep } from './steps/GroupsStep';

interface OnboardingModalProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 4;

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return <CallsStep />;
      case 2:
        return <FriendsStep />;
      case 3:
        return <GroupsStep />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-xl"
      >
        {/* Step Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-4">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentStep ? 'bg-sky-soft-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip
            </button>

            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-sky-soft-500 text-white rounded-xl font-medium hover:bg-sky-soft-600 transition-colors"
            >
              {currentStep === TOTAL_STEPS - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
