// Overlap calendar: two-row week strips showing both users' shifts
import { useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachWeekOfInterval,
  format,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns';
import type { ShiftType } from '../types/database';
import { SHIFT_TYPE_MAP } from '../constants/shiftTypes';

interface OverlapCalendarProps {
  myShiftMap: Map<string, ShiftType>;
  friendShiftMap: Map<string, ShiftType>;
  friendName: string;
}

// Shift cell colors (matching main calendar)
function getShiftStyle(shiftType: ShiftType | undefined, isPast: boolean): React.CSSProperties {
  if (!shiftType) {
    return { backgroundColor: isPast ? '#f9fafb' : '#f3f4f6' };
  }
  const config = SHIFT_TYPE_MAP[shiftType];
  if (!config) return { backgroundColor: '#f3f4f6' };

  if (isPast) {
    return {
      backgroundColor: config.color + '40',
      boxShadow: `inset 2px 0 0 0 ${config.accentColor}60`,
    };
  }
  return {
    backgroundColor: config.color,
    boxShadow: `inset 2px 0 0 0 ${config.accentColor}`,
  };
}

export function OverlapCalendar({ myShiftMap, friendShiftMap, friendName }: OverlapCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  // Get all weeks in the calendar range
  const weeks = eachWeekOfInterval({ start: calStart, end: calEnd });

  const today = startOfDay(new Date());

  // Truncate friend name to first name
  const shortName = friendName.split(' ')[0];
  // Ensure label fits: max 5 chars
  const friendLabel = shortName.length > 5 ? shortName.slice(0, 5) : shortName;

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
        >
          &#8249;
        </button>
        <div className="text-center">
          <h3 className="text-sm font-bold text-gray-800">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="text-xs text-sky-soft-600 hover:text-sky-soft-700"
          >
            Today
          </button>
        </div>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
        >
          &#8250;
        </button>
      </div>

      {/* Day headers */}
      <div className="grid gap-0.5 mb-1" style={{ gridTemplateColumns: '36px repeat(7, 1fr)' }}>
        <div />
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="text-center text-gray-500 font-medium" style={{ fontSize: 10 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Week blocks */}
      {weeks.map((weekStart) => {
        const weekDays = eachDayOfInterval({
          start: weekStart,
          end: endOfWeek(weekStart),
        });

        return (
          <div key={weekStart.toISOString()} className="mb-1.5">
            {/* Date numbers */}
            <div className="grid gap-0.5" style={{ gridTemplateColumns: '36px repeat(7, 1fr)' }}>
              <div />
              {weekDays.map((day) => {
                const inMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);
                return (
                  <div
                    key={day.toISOString()}
                    className="text-center"
                    style={{
                      fontSize: 9,
                      color: !inMonth ? '#d1d5db' : isTodayDate ? '#0369a1' : '#6b7280',
                      fontWeight: isTodayDate ? 700 : 400,
                    }}
                  >
                    {format(day, 'd')}
                  </div>
                );
              })}
            </div>

            {/* Your shifts */}
            <div className="grid gap-0.5 mt-0.5" style={{ gridTemplateColumns: '36px repeat(7, 1fr)' }}>
              <div className="text-right pr-1 flex items-center justify-end" style={{ fontSize: 8, color: '#9ca3af', fontWeight: 600 }}>
                You
              </div>
              {weekDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const inMonth = isSameMonth(day, currentMonth);
                const isPast = isBefore(day, today);
                const isTodayDate = isToday(day);
                const shift = myShiftMap.get(dateStr);

                if (!inMonth) return <div key={day.toISOString()} style={{ height: 20 }} />;

                return (
                  <div
                    key={day.toISOString()}
                    className="rounded"
                    style={{
                      height: 20,
                      ...getShiftStyle(shift, isPast),
                      ...(isTodayDate ? { outline: '1.5px solid #38bdf8', outlineOffset: -1 } : {}),
                    }}
                  />
                );
              })}
            </div>

            {/* Friend's shifts */}
            <div className="grid gap-0.5 mt-0.5" style={{ gridTemplateColumns: '36px repeat(7, 1fr)' }}>
              <div className="text-right pr-1 flex items-center justify-end" style={{ fontSize: 8, color: '#9ca3af', fontWeight: 600 }}>
                {friendLabel}
              </div>
              {weekDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const inMonth = isSameMonth(day, currentMonth);
                const isPast = isBefore(day, today);
                const isTodayDate = isToday(day);
                const shift = friendShiftMap.get(dateStr);

                if (!inMonth) return <div key={day.toISOString()} style={{ height: 20 }} />;

                return (
                  <div
                    key={day.toISOString()}
                    className="rounded"
                    style={{
                      height: 20,
                      ...getShiftStyle(shift, isPast),
                      ...(isTodayDate ? { outline: '1.5px solid #38bdf8', outlineOffset: -1 } : {}),
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex flex-wrap gap-2.5 mt-3 pt-3 border-t border-gray-100 justify-center">
        {[
          { color: '#7dd3fc', label: 'Call' },
          { color: '#5eead4', label: 'Off' },
          { color: '#c4b5fd', label: 'Work' },
          { color: '#fdba74', label: 'Half' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="text-gray-500" style={{ fontSize: 10 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
