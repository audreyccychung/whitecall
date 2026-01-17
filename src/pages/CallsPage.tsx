// Calls calendar page - mark days you're on call
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, isBefore, startOfDay, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useCalls } from '../hooks/useCalls';
import { CallCalendar } from '../components/CallCalendar';

export default function CallsPage() {
  const { user } = useAuth();
  const { calls, loading, error, toggleCall } = useCalls(user?.id);

  // Convert calls array to Set for O(1) lookup
  const callDates = useMemo(() => {
    return new Set(calls.map((c) => c.call_date));
  }, [calls]);

  // Get upcoming calls (today and future)
  const upcomingCalls = useMemo(() => {
    const today = startOfDay(new Date());
    return calls
      .filter((c) => !isBefore(parseISO(c.call_date), today))
      .slice(0, 5); // Show max 5 upcoming
  }, [calls]);

  const handleToggleDate = async (date: string) => {
    await toggleCall(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-soft-50 to-white-call-100">
      {/* Header */}
      <header className="bg-white shadow-soft">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">My Calls</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Instructions */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-gray-600"
        >
          Tap a date to mark when you're on call
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
            callDates={callDates}
            onToggleDate={handleToggleDate}
            disabled={loading}
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
              {upcomingCalls.map((call) => (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-sky-soft-100 rounded-lg flex items-center justify-center">
                      <span className="text-sky-soft-600 font-bold">
                        {format(parseISO(call.call_date), 'd')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {format(parseISO(call.call_date), 'EEEE, MMMM d')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(parseISO(call.call_date), 'yyyy')}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleCall(call.call_date)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2"
                    aria-label="Remove call"
                  >
                    ✕
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
