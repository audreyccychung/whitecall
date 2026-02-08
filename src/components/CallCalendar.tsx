// Calendar component for selecting shift days
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
import type { CallRating, ShiftType, WorkPattern } from '../types/database';
import { RatingIcon } from './RatingIcon';
import { SHIFT_TYPE_MAP, getShiftTypesForPattern, getDesaturatedColor, isShiftRatable } from '../constants/shiftTypes';

interface CallCalendarProps {
  shiftMap: Map<string, ShiftType>; // YYYY-MM-DD -> shift type
  ratingsMap?: Map<string, CallRating>;
  workPattern: WorkPattern;
  onDateTap: (date: string) => void; // Opens shift picker
  onPastCallClick?: (date: string) => void; // Opens rating modal for ratable past shifts
  disabled?: boolean;
}

export function CallCalendar({ shiftMap, ratingsMap, workPattern, onDateTap, onPastCallClick, disabled = false }: CallCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handleDateClick = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const isPastDate = isBefore(day, startOfDay(new Date())) && !isToday(day);
    const shiftType = shiftMap.get(dateStr);
    const hasShift = !!shiftType;

    // Past date without shift - not clickable
    if (isPastDate && !hasShift) {
      return;
    }

    // Past date WITH ratable shift - open rating modal
    if (isPastDate && hasShift && isShiftRatable(shiftType, workPattern)) {
      onPastCallClick?.(dateStr);
      return;
    }

    // Past date WITH non-ratable shift - not clickable
    if (isPastDate && hasShift) {
      return;
    }

    // Future/today dates - open shift picker (blocked when disabled)
    if (disabled) return;

    onDateTap(dateStr);
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

  // Get shift types for legend based on work pattern
  const legendShiftTypes = getShiftTypesForPattern(workPattern);

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
          const shiftType = shiftMap.get(dateStr);
          const hasShift = !!shiftType;
          const isPast = isBefore(day, startOfDay(new Date())) && !isTodayDate;
          const rating = ratingsMap?.get(dateStr);
          const hasRating = !!rating;

          // Is this past shift ratable?
          const ratable = hasShift && isPast && isShiftRatable(shiftType!, workPattern);

          // Get the shift config for coloring
          const shiftConfig = shiftType ? SHIFT_TYPE_MAP[shiftType] : null;

          // Determine styles based on state priority
          const style: React.CSSProperties = {};
          let extraClasses = '';

          if (!isCurrentMonth) {
            style.color = '#d1d5db'; // gray-300
          } else if (hasShift && !isPast) {
            // Future/today shifts: Full color circle with ring
            style.backgroundColor = shiftConfig!.color;
            style.color = '#ffffff';
            style.boxShadow = `0 0 0 2px ${shiftConfig!.ringColor}, 0 0 0 4px #ffffff`;
          } else if (hasShift && isPast) {
            // Past shifts: Desaturated version of the shift color
            // Preserves hue identity so users can still recognize the shift type
            style.backgroundColor = getDesaturatedColor(shiftConfig!.color);
            style.color = '#ffffff';
          } else if (isPast) {
            // Past without shift: Grayed out text
            style.color = '#d1d5db'; // gray-300
          } else if (isTodayDate) {
            style.boxShadow = '0 0 0 2px #0ea5e9, 0 0 0 4px #ffffff';
          }

          // Hover states
          if (!hasShift && !isPast && isCurrentMonth) {
            extraClasses = 'hover:bg-gray-100';
          } else if (hasShift && isPast && ratable && isCurrentMonth) {
            extraClasses = 'hover:brightness-90';
          }

          // Clickability: past ratable shifts (for rating) or future dates (for picker)
          const isPastRatableClickable = isPast && hasShift && ratable;
          const isFutureDateClickable = !disabled && !isPast && isCurrentMonth;
          const isClickable = isPastRatableClickable || isFutureDateClickable;

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
                ${isClickable ? 'cursor-pointer' : 'cursor-default'}
              `}
            >
              {/* Show date with rating icon below for rated ratable past shifts */}
              {isPast && hasShift && hasRating && ratable ? (
                <div className="flex flex-col items-center leading-none gap-0.5">
                  <span>{format(day, 'd')}</span>
                  <RatingIcon rating={rating.rating} size="sm" />
                </div>
              ) : (
                format(day, 'd')
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-gray-600">
        {legendShiftTypes.map((st) => (
          <div key={st.id} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: st.color }}
            />
            <span>{st.shortLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
