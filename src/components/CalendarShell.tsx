// Shared calendar shell: month navigation, day headers, week iteration
// Used by OverlapCalendar and GroupOverlapCalendar to avoid duplication
import { useState } from 'react';
import { getShiftCellStyle } from '../utils/shiftStyles';
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

export interface WeekDay {
  day: Date;
  dateStr: string;
  inMonth: boolean;
  isToday: boolean;
  isPast: boolean;
}

interface CalendarShellProps {
  renderWeek: (weekDays: WeekDay[], weekStart: Date) => React.ReactNode;
  legend?: React.ReactNode;
}

export function CalendarShell({ renderWeek, legend }: CalendarShellProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const weeks = eachWeekOfInterval({ start: calStart, end: calEnd });
  const today = startOfDay(new Date());

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

      {/* Weeks */}
      {weeks.map((weekStart) => {
        const weekDays: WeekDay[] = eachDayOfInterval({
          start: weekStart,
          end: endOfWeek(weekStart),
        }).map((day) => ({
          day,
          dateStr: format(day, 'yyyy-MM-dd'),
          inMonth: isSameMonth(day, currentMonth),
          isToday: isToday(day),
          isPast: isBefore(day, today),
        }));

        return (
          <div key={weekStart.toISOString()}>
            {renderWeek(weekDays, weekStart)}
          </div>
        );
      })}

      {/* Legend */}
      {legend || (
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
      )}
    </div>
  );
}

// Shared date number row
export function DateRow({ weekDays }: { weekDays: WeekDay[] }) {
  return (
    <div className="grid gap-0.5" style={{ gridTemplateColumns: '36px repeat(7, 1fr)' }}>
      <div />
      {weekDays.map((wd) => (
        <div
          key={wd.dateStr}
          className="text-center"
          style={{
            fontSize: 9,
            color: !wd.inMonth ? '#d1d5db' : wd.isToday ? '#0369a1' : '#6b7280',
            fontWeight: wd.isToday ? 700 : 400,
          }}
        >
          {format(wd.day, 'd')}
        </div>
      ))}
    </div>
  );
}

// Shared shift row
export function ShiftRow({
  label,
  weekDays,
  getShift,
  cellHeight = 20,
}: {
  label: string;
  weekDays: WeekDay[];
  getShift: (dateStr: string) => import('../types/database').ShiftType | undefined;
  cellHeight?: number;
}) {

  return (
    <div className="grid gap-0.5 mt-0.5" style={{ gridTemplateColumns: '36px repeat(7, 1fr)' }}>
      <div className="text-right pr-1 flex items-center justify-end" style={{ fontSize: 8, color: '#9ca3af', fontWeight: 600 }}>
        {label}
      </div>
      {weekDays.map((wd) => {
        if (!wd.inMonth) return <div key={wd.dateStr} style={{ height: cellHeight }} />;
        const shift = getShift(wd.dateStr);
        return (
          <div
            key={wd.dateStr}
            className="rounded"
            style={{
              height: cellHeight,
              ...getShiftCellStyle(shift, wd.isPast),
              ...(wd.isToday ? { outline: '1.5px solid #38bdf8', outlineOffset: -1 } : {}),
            }}
          />
        );
      })}
    </div>
  );
}
