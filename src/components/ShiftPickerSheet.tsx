// Bottom sheet for selecting shift types on a date
// Pinned to bottom of viewport — no overlay, calendar stays visible above
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { getShiftTypesForPattern } from '../constants/shiftTypes';
import type { ShiftType } from '../types/database';

interface ShiftPickerSheetProps {
  selectedDate: string; // YYYY-MM-DD
  currentShiftType: ShiftType | null;
  isLoading: boolean;
  onSelectShift: (date: string, shiftType: ShiftType) => Promise<void>;
  onClearShift: (date: string) => Promise<void>;
  onClose: () => void;
}

export function ShiftPickerSheet({
  selectedDate,
  currentShiftType,
  isLoading,
  onSelectShift,
  onClearShift,
  onClose,
}: ShiftPickerSheetProps) {
  const { profile } = useAuth();
  const workPattern = profile?.work_pattern || 'call';
  const shiftTypes = getShiftTypesForPattern(workPattern);

  const formattedDate = format(parseISO(selectedDate), 'EEEE, MMMM d');

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.12)] modal-safe-bottom"
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 bg-gray-300 rounded-full" />
      </div>

      <div className="px-6 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-gray-800">{formattedDate}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1"
            aria-label="Close shift picker"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">Select a shift type</p>

        {/* Shift Type Grid - 2x2 */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {shiftTypes.map((st) => {
            const isSelected = currentShiftType === st.id;
            return (
              <motion.button
                key={st.id}
                onClick={() => onSelectShift(selectedDate, st.id)}
                disabled={isLoading}
                whileTap={{ scale: 0.95 }}
                className={`
                  flex items-center gap-3 p-4 rounded-xl transition-all min-h-[56px]
                  ${isSelected
                    ? 'ring-2 bg-gray-50'
                    : 'bg-gray-50 hover:bg-gray-100'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={isSelected ? { boxShadow: `0 0 0 2px ${st.color}` } : undefined}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: st.color }}
                >
                  <span className="text-sm">{st.icon}</span>
                </div>
                <span className="text-sm font-medium text-gray-800">{st.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Clear Button */}
        {currentShiftType && (
          <button
            onClick={() => onClearShift(selectedDate)}
            disabled={isLoading}
            className="w-full py-3 text-red-500 hover:bg-red-50 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center mt-2">
            <div className="w-5 h-5 border-2 border-sky-soft-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
