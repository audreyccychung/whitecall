// Calls calendar page - mark days with shift types
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isBefore, startOfDay, parseISO, addDays } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useCalls } from '../hooks/useCalls';
import { useCallRatings } from '../hooks/useCallRatings';
import { downloadICS } from '../utils/icsGenerator';
import { CallCalendar } from '../components/CallCalendar';
import { ShiftPickerSheet } from '../components/ShiftPickerSheet';
import { RateCallModal } from '../components/RateCallModal';
import { AddPastCallModal } from '../components/AddPastCallModal';
import { SHIFT_TYPE_MAP } from '../constants/shiftTypes';
import type { CallRating, ShiftType } from '../types/database';

export default function CallsPage() {
  const { user, profile } = useAuth();
  const { calls, loading, error, setShift, clearShift, deleteCall, refreshCalls } = useCalls(user?.id);
  const { ratingsMap, isLoading: ratingsLoading, refetch: refetchRatings } = useCallRatings(user?.id);

  const workPattern = profile?.work_pattern || 'call';

  // Shift picker state
  const [shiftPickerOpen, setShiftPickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [shiftLoading, setShiftLoading] = useState(false);

  // Modal state for rating existing call
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean;
    callDate: string;
    existingRating?: CallRating;
  }>({ isOpen: false, callDate: '' });

  // Modal state for adding past call
  const [showAddPastCall, setShowAddPastCall] = useState(false);

  // Calendar export state
  const [exportingCalendar, setExportingCalendar] = useState(false);

  // Build shift map from calls for O(1) lookup
  const shiftMap = useMemo(() => {
    const map = new Map<string, ShiftType>();
    for (const c of calls) {
      map.set(c.call_date, c.shift_type);
    }
    return map;
  }, [calls]);

  // Get upcoming calls (today and future), excluding days off
  // Call-based: only show 'call' type (not day_off, work, half_day)
  // Shift-based: only show shifts (am, pm, night), not 'off'
  const upcomingCalls = useMemo(() => {
    const today = startOfDay(new Date());
    const offTypes = workPattern === 'call'
      ? new Set(['day_off', 'work', 'half_day'])
      : new Set(['off']);
    return calls
      .filter((c) => !isBefore(parseISO(c.call_date), today) && !offTypes.has(c.shift_type))
      .slice(0, 5); // Show max 5 upcoming
  }, [calls, workPattern]);

  // Handle date tap - open shift picker
  const handleDateTap = (date: string) => {
    setSelectedDate(date);
    setShiftPickerOpen(true);
  };

  // Handle shift selection from picker
  const handleSelectShift = async (date: string, shiftType: ShiftType) => {
    setShiftLoading(true);
    try {
      await setShift(date, shiftType);
      // Auto-advance to next day
      const nextDate = format(addDays(parseISO(date), 1), 'yyyy-MM-dd');
      setSelectedDate(nextDate);
    } finally {
      setShiftLoading(false);
    }
  };

  // Handle clear shift from picker
  const handleClearShift = async (date: string) => {
    setShiftLoading(true);
    try {
      await clearShift(date);
      // Auto-advance to next day
      const nextDate = format(addDays(parseISO(date), 1), 'yyyy-MM-dd');
      setSelectedDate(nextDate);
    } finally {
      setShiftLoading(false);
    }
  };

  // Handle click on past call in calendar (for rating)
  const handlePastCallClick = (callDate: string) => {
    const existingRating = ratingsMap.get(callDate);
    setRatingModal({ isOpen: true, callDate, existingRating });
  };

  // Close modals
  const closeRatingModal = () => {
    setRatingModal({ isOpen: false, callDate: '' });
  };

  const closeShiftPicker = () => {
    setShiftPickerOpen(false);
    setSelectedDate('');
  };

  // Handle past call added - refetch both calls and ratings
  const handlePastCallSaved = async () => {
    await Promise.all([refreshCalls(), refetchRatings()]);
  };

  // Handle calendar export
  const handleCalendarExport = () => {
    if (upcomingCalls.length === 0) return;

    setExportingCalendar(true);
    try {
      downloadICS(upcomingCalls);
    } finally {
      setExportingCalendar(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-soft-50 to-white-call-100">
      {/* Header */}
      <header className="bg-white shadow-soft">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">My Calls</h1>
          <button
            onClick={() => setShowAddPastCall(true)}
            className="p-2 bg-sky-soft-500 text-white rounded-lg hover:bg-sky-soft-600 transition-colors"
            aria-label="Add past call"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Instructions */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-gray-600"
        >
          Tap a date to add a shift
        </motion.p>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CallCalendar
            shiftMap={shiftMap}
            ratingsMap={ratingsMap}
            workPattern={workPattern}
            onDateTap={handleDateTap}
            onPastCallClick={handlePastCallClick}
            disabled={loading || ratingsLoading}
          />
        </motion.div>

        {/* Upcoming Calls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-soft-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Calls</h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-sky-soft-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-600">Loading calls...</p>
            </div>
          ) : upcomingCalls.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-5xl mb-4">📅</p>
              <p className="text-gray-600">No upcoming calls</p>
              <p className="text-sm text-gray-500 mt-1">Tap a date above to add one</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingCalls.map((call) => {
                const config = SHIFT_TYPE_MAP[call.shift_type];
                return (
                  <motion.div
                    key={call.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: config ? config.color + '20' : '#e0f2fe' }}
                      >
                        <span
                          className="font-bold"
                          style={{ color: config?.color || '#0284c7' }}
                        >
                          {format(parseISO(call.call_date), 'd')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {format(parseISO(call.call_date), 'EEEE, MMMM d')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {config?.label || 'Call'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteCall(call.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-2"
                      aria-label="Remove call"
                    >
                      ✕
                    </button>
                  </motion.div>
                );
              })}

              {/* Export button */}
              <button
                onClick={handleCalendarExport}
                disabled={exportingCalendar}
                className="w-full mt-4 flex items-center justify-center gap-2 p-3 bg-sky-soft-50 text-sky-soft-700 rounded-xl hover:bg-sky-soft-100 transition-colors disabled:opacity-50"
              >
                {exportingCalendar ? (
                  <div className="w-4 h-4 border-2 border-sky-soft-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>📅</span>
                )}
                <span>Export to calendar</span>
              </button>
              <p className="text-xs text-gray-400 text-center">Opens in your default calendar app</p>
            </div>
          )}
        </motion.div>
      </main>

      {/* Shift Picker Sheet */}
      <AnimatePresence>
        {shiftPickerOpen && selectedDate && (
          <ShiftPickerSheet
            selectedDate={selectedDate}
            currentShiftType={shiftMap.get(selectedDate) || null}
            isLoading={shiftLoading}
            onSelectShift={handleSelectShift}
            onClearShift={handleClearShift}
            onClose={closeShiftPicker}
          />
        )}
      </AnimatePresence>

      {/* Rating Modal */}
      <AnimatePresence>
        {ratingModal.isOpen && (
          <RateCallModal
            callDate={ratingModal.callDate}
            existingRating={ratingModal.existingRating}
            onClose={closeRatingModal}
          />
        )}
      </AnimatePresence>

      {/* Add Past Call Modal */}
      <AnimatePresence>
        {showAddPastCall && (
          <AddPastCallModal
            onClose={() => setShowAddPastCall(false)}
            onSaved={handlePastCallSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
