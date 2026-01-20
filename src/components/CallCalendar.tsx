// Calendar component for selecting call days
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns';

interface CallCalendarProps {
  callDates: Set<string>; // Set of YYYY-MM-DD strings
  onToggleDate: (date: string) => Promise<void>;
  onPastCallClick?: (date: string) => void; // Callback when clicking a past call date
  disabled?: boolean;
}

export function CallCalendar({ callDates, onToggleDate, onPastCallClick, disabled = false }: CallCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loadingDate, setLoadingDate] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handleDateClick = async (date: Date) => {
    if (disabled) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const isPastDate = isBefore(date, startOfDay(new Date())) && !isToday(date);
    const dateHasCall = callDates.has(dateStr);

    // Past date without call - not clickable
    if (isPastDate && !dateHasCall) {
      return;
    }

    // Past date WITH call - trigger past call click handler (for rating)
    if (isPastDate && dateHasCall) {
      onPastCallClick?.(dateStr);
      return;
    }

    // Future/today dates - toggle call on/off
    setLoadingDate(dateStr);
    try {
      await onToggleDate(dateStr);
    } finally {
      setLoadingDate(null);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft-lg p-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <span className="text-xl text-gray-600">&#8249;</span>
        </button>

        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={goToToday}
            className="text-sm text-sky-soft-600 hover:text-sky-soft-700 mt-1"
          >
            Today
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <span className="text-xl text-gray-600">&#8250;</span>
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);
          const hasCall = callDates.has(dateStr);
          const isPast = isBefore(day, startOfDay(new Date())) && !isTodayDate;
          const isLoading = loadingDate === dateStr;

          // Determine styles based on state priority
          const style: React.CSSProperties = {};
          let extraClasses = '';

          if (!isCurrentMonth) {
            style.color = '#d1d5db'; // gray-300
          } else if (hasCall && !isPast) {
            // Future/today calls: Blue filled circle
            style.backgroundColor = '#0ea5e9'; // sky-soft-500
            style.color = '#ffffff';
            style.boxShadow = '0 0 0 2px #0284c7, 0 0 0 4px #ffffff'; // ring effect
          } else if (hasCall && isPast) {
            // Past calls: Gray filled circle (clickable for rating)
            style.backgroundColor = '#9ca3af'; // gray-400
            style.color = '#ffffff';
          } else if (isPast) {
            // Past without call: Grayed out text
            style.color = '#d1d5db'; // gray-300
          } else if (isTodayDate) {
            style.boxShadow = '0 0 0 2px #0ea5e9, 0 0 0 4px #ffffff'; // ring effect
          }

          // Hover states
          if (!hasCall && !isPast && isCurrentMonth) {
            extraClasses = 'hover:bg-gray-100';
          } else if (hasCall && isPast && isCurrentMonth) {
            // Past calls get hover feedback for clickability
            extraClasses = 'hover:bg-gray-500';
          }

          // Past calls are clickable (for rating), past non-calls are not
          const isClickable = !disabled && !isLoading && (!isPast || hasCall);

          return (
            <motion.button
              key={dateStr}
              onClick={() => handleDateClick(day)}
              disabled={!isClickable}
              whileTap={isClickable ? { scale: 0.95 } : undefined}
              style={style}
              className={`
                relative aspect-square flex items-center justify-center rounded-full text-sm font-medium
                transition-all min-h-[44px]
                ${extraClasses}
                ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                ${isLoading ? 'opacity-60' : ''}
              `}
            >
              {format(day, 'd')}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-sky-soft-500 rounded-full ring-2 ring-sky-soft-600 ring-offset-1" />
          <span>On call</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-400 rounded-full" />
          <span>Past call</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-sky-soft-500 rounded-full" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
