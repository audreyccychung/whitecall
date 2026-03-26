// Group overlap calendar: N rows per week (one per member), month view
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
import { getShiftCellStyle } from '../utils/shiftStyles';

interface GroupMemberInfo {
  userId: string;
  name: string;
}

interface GroupOverlapCalendarProps {
  myUserId: string;
  members: GroupMemberInfo[];
  // date (YYYY-MM-DD) -> userId -> ShiftType
  callsMap: Map<string, Map<string, ShiftType>>;
}

export function GroupOverlapCalendar({ myUserId, members, callsMap }: GroupOverlapCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const weeks = eachWeekOfInterval({ start: calStart, end: calEnd });
  const today = startOfDay(new Date());

  // Sort members: current user first, then alphabetical
  const sortedMembers = [...members].sort((a, b) => {
    if (a.userId === myUserId) return -1;
    if (b.userId === myUserId) return 1;
    return a.name.localeCompare(b.name);
  });

  // Truncate name for row label
  const getLabel = (m: GroupMemberInfo) => {
    if (m.userId === myUserId) return 'You';
    const first = m.name.split(' ')[0];
    return first.length > 5 ? first.slice(0, 5) : first;
  };

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
          <div key={weekStart.toISOString()} className="mb-2">
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

            {/* Member rows */}
            {sortedMembers.map((member) => (
              <div
                key={member.userId}
                className="grid gap-0.5 mt-0.5"
                style={{ gridTemplateColumns: '36px repeat(7, 1fr)' }}
              >
                <div
                  className="text-right pr-1 flex items-center justify-end"
                  style={{ fontSize: 8, color: '#9ca3af', fontWeight: 600 }}
                >
                  {getLabel(member)}
                </div>
                {weekDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const inMonth = isSameMonth(day, currentMonth);
                  const isPast = isBefore(day, today);
                  const isTodayDate = isToday(day);

                  if (!inMonth) return <div key={day.toISOString()} style={{ height: 16 }} />;

                  const dayMap = callsMap.get(dateStr);
                  const shift = dayMap?.get(member.userId) as ShiftType | undefined;

                  return (
                    <div
                      key={day.toISOString()}
                      className="rounded"
                      style={{
                        height: 16,
                        ...getShiftCellStyle(shift, isPast),
                        ...(isTodayDate ? { outline: '1.5px solid #38bdf8', outlineOffset: -1 } : {}),
                      }}
                    />
                  );
                })}
              </div>
            ))}
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
