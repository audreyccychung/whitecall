// Calendar component for selecting shift days
import { useState, useRef, useCallback } from 'react';
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
import { SHIFT_TYPE_MAP, getShiftTypesForPattern, getPastAccentColor, isOnDutyShift } from '../constants/shiftTypes';

interface CallCalendarProps {
  shiftMap: Map<string, ShiftType>; // YYYY-MM-DD -> shift type
  ratingsMap?: Map<string, CallRating>;
  workPattern: WorkPattern;
  onDateTap: (date: string) => void; // Opens shift picker
  onPastCallClick?: (date: string) => void; // Opens rating modal for ratable past shifts (long-press)
  disabled?: boolean;
}

export function CallCalendar({ shiftMap, ratingsMap, workPattern, onDateTap, onPastCallClick, disabled = false }: CallCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handleDateClick = (day: Date) => {
    // If long-press just fired, skip the tap
    if (didLongPress.current) {
      didLongPress.current = false;
      return;
    }
    if (!isSameMonth(day, currentMonth) || disabled) return;
    const dateStr = format(day, 'yyyy-MM-dd');
    onDateTap(dateStr);
  };

  // Long-press handlers for rating past ratable shifts
  const handlePointerDown = useCallback((dateStr: string) => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onPastCallClick?.(dateStr);
    }, 500);
  }, [onPastCallClick]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

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

          // Is this past shift ratable? Only on-duty shifts (call/am/pm/night)
          const ratable = hasShift && isPast && isOnDutyShift(shiftType!);

          // Get the shift config for coloring
          const shiftConfig = shiftType ? SHIFT_TYPE_MAP[shiftType] : null;

          // Determine styles based on state priority
          const style: React.CSSProperties = {};
          let extraClasses = '';

          if (!isCurrentMonth) {
            // Out of month
            style.color = '#d1d5db'; // gray-300
          } else if (isTodayDate && hasShift) {
            // TODAY + SHIFT: hero ring + tint + left bracket
            style.backgroundColor = shiftConfig!.accentColor + '14'; // 8% opacity tint
            style.color = '#0369a1'; // sky-soft-700
            style.fontWeight = 600;
            style.boxShadow = `inset 3px 0 0 0 ${shiftConfig!.accentColor}, 0 0 0 2px #38bdf8`;
          } else if (isTodayDate) {
            // TODAY (no shift): the ONE hero cell
            style.backgroundColor = '#f0f9ff';
            style.color = '#0369a1';
            style.fontWeight = 600;
            style.boxShadow = '0 0 0 2px #38bdf8';
          } else if (hasShift && !isPast) {
            // FUTURE SHIFT: tint + left bracket
            style.backgroundColor = shiftConfig!.accentColor + '14'; // 8% opacity tint
            style.color = '#1f2937'; // gray-800
            style.fontWeight = 600;
            style.boxShadow = `inset 3px 0 0 0 ${shiftConfig!.accentColor}`;
          } else if (hasShift && isPast) {
            // PAST SHIFT: faint tint + muted bracket
            style.backgroundColor = shiftConfig!.accentColor + '0a'; // 4% opacity tint
            style.color = '#9ca3af'; // gray-400
            style.boxShadow = `inset 3px 0 0 0 ${getPastAccentColor(shiftConfig!.accentColor)}`;
          } else if (isPast) {
            // PAST EMPTY: muted text
            style.color = '#d1d5db'; // gray-300
          }

          // Hover states
          if (isCurrentMonth && !hasShift) {
            extraClasses = 'hover:bg-gray-50';
          } else if (isCurrentMonth && hasShift) {
            extraClasses = 'hover:brightness-95';
          }

          // All in-month dates are clickable (opens shift picker)
          const isClickable = !disabled && isCurrentMonth;

          return (
            <motion.button
              key={dateStr}
              onClick={() => handleDateClick(day)}
              onPointerDown={ratable ? () => handlePointerDown(dateStr) : undefined}
              onPointerUp={ratable ? handlePointerUp : undefined}
              onPointerLeave={ratable ? handlePointerUp : undefined}
              disabled={!isClickable}
              whileTap={isClickable ? { scale: 0.95 } : undefined}
              style={style}
              className={`
                relative aspect-square flex items-center justify-center rounded-xl text-sm font-medium text-gray-700
                transition-all min-h-[44px]
                ${extraClasses}
                ${isClickable ? 'cursor-pointer' : 'cursor-default'}
              `}
            >
              {/* Show date with indicator dot or rating icon */}
              {isPast && hasShift && hasRating && ratable ? (
                <div className="flex flex-col items-center leading-none gap-0.5">
                  <span>{format(day, 'd')}</span>
                  <RatingIcon rating={rating.rating} size="sm" />
                </div>
              ) : hasShift && isCurrentMonth && !isPast ? (
                <div className="flex flex-col items-center leading-none gap-0.5">
                  <span>{format(day, 'd')}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
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
              className="w-3 h-2 rounded-sm"
              style={{ backgroundColor: st.accentColor }}
            />
            <span>{st.shortLabel}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
