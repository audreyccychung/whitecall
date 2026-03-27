// Group overlap calendar: weekly view with N rows (one per member)
// Swipe or tap arrows to navigate between weeks
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  format,
  isToday,
  isBefore,
  startOfDay,
  isSameWeek,
} from 'date-fns';
import type { ShiftType } from '../types/database';
import { SHIFT_TYPE_MAP } from '../constants/shiftTypes';
import { getShiftCellStyle } from '../utils/shiftStyles';

interface GroupMemberInfo {
  userId: string;
  name: string;
}

interface GroupOverlapCalendarProps {
  myUserId: string;
  members: GroupMemberInfo[];
  callsMap: Map<string, Map<string, ShiftType>>;
}

// Short shift label for larger cells
const SHIFT_LABELS: Partial<Record<ShiftType, string>> = {
  call: 'Call',
  am: 'AM',
  pm: 'PM',
  night: 'Night',
  day_off: 'Off',
  off: 'Off',
  work: 'Work',
  half_day: 'Half',
};

export function GroupOverlapCalendar({ myUserId, members, callsMap }: GroupOverlapCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
  const [direction, setDirection] = useState(0);

  const today = startOfDay(new Date());
  const isThisWeek = isSameWeek(currentWeekStart, new Date());

  const weekDays = eachDayOfInterval({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart),
  });

  // Sort: current user first, then alphabetical
  const sortedMembers = [...members].sort((a, b) => {
    if (a.userId === myUserId) return -1;
    if (b.userId === myUserId) return 1;
    return a.name.localeCompare(b.name);
  });

  const getLabel = (m: GroupMemberInfo) => {
    if (m.userId === myUserId) return 'You';
    const first = m.name.split(' ')[0];
    return first.length > 6 ? first.slice(0, 6) : first;
  };

  const goNext = () => { setDirection(1); setCurrentWeekStart(addWeeks(currentWeekStart, 1)); };
  const goPrev = () => { setDirection(-1); setCurrentWeekStart(subWeeks(currentWeekStart, 1)); };
  const goToday = () => { setDirection(0); setCurrentWeekStart(startOfWeek(new Date())); };

  // Week label: "Mar 24 – 30" or "Mar 28 – Apr 3"
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const weekLabel = format(weekStart, 'MMM') === format(weekEnd, 'MMM')
    ? `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'd')}`
    : `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`;

  return (
    <div>
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goPrev}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 text-lg"
        >
          &#8249;
        </button>
        <div className="text-center">
          <h3 className="text-sm font-bold text-gray-800">{weekLabel}</h3>
          {!isThisWeek && (
            <button
              onClick={goToday}
              className="text-xs text-sky-soft-600 hover:text-sky-soft-700"
            >
              This week
            </button>
          )}
        </div>
        <button
          onClick={goNext}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 text-lg"
        >
          &#8250;
        </button>
      </div>

      {/* Calendar grid */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentWeekStart.toISOString()}
          initial={{ opacity: 0, x: direction * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -40 }}
          transition={{ duration: 0.15 }}
        >
          {/* Day headers with dates */}
          <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
            <div />
            {weekDays.map((day) => {
              const isTodayDate = isToday(day);
              return (
                <div key={day.toISOString()} className="text-center">
                  <div
                    className="font-medium"
                    style={{
                      fontSize: 10,
                      color: isTodayDate ? '#0369a1' : '#9ca3af',
                    }}
                  >
                    {format(day, 'EEE')}
                  </div>
                  <div
                    className={`text-xs font-semibold ${isTodayDate ? 'text-white' : 'text-gray-700'}`}
                    style={isTodayDate ? {
                      backgroundColor: '#38bdf8',
                      borderRadius: '50%',
                      width: 22,
                      height: 22,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                    } : { fontSize: 11 }}
                  >
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Member rows */}
          {sortedMembers.map((member) => (
            <div
              key={member.userId}
              className="grid gap-1 mb-1"
              style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}
            >
              {/* Name label */}
              <div
                className="text-right pr-1.5 flex items-center justify-end"
                style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}
              >
                {getLabel(member)}
              </div>

              {/* Shift cells — bigger, with labels */}
              {weekDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isPast = isBefore(day, today);
                const isTodayDate = isToday(day);
                const dayMap = callsMap.get(dateStr);
                const shift = dayMap?.get(member.userId) as ShiftType | undefined;
                const config = shift ? SHIFT_TYPE_MAP[shift] : null;
                const label = shift ? SHIFT_LABELS[shift] : null;

                return (
                  <div
                    key={day.toISOString()}
                    className="rounded-md flex items-center justify-center"
                    style={{
                      height: 28,
                      ...getShiftCellStyle(shift, isPast),
                      ...(isTodayDate ? { outline: '2px solid #38bdf8', outlineOffset: -1 } : {}),
                    }}
                  >
                    {label && (
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 600,
                          color: isPast
                            ? '#9ca3af'
                            : config?.ringColor || '#6b7280',
                          opacity: isPast ? 0.7 : 1,
                        }}
                      >
                        {label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Legend */}
      <div className="flex flex-wrap gap-2.5 mt-4 pt-3 border-t border-gray-100 justify-center">
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
