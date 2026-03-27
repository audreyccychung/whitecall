// Overlap calendar: two-row week strips showing both users' shifts
import type { ShiftType } from '../types/database';
import { CalendarShell, DateRow, ShiftRow } from './CalendarShell';

interface OverlapCalendarProps {
  myShiftMap: Map<string, ShiftType>;
  friendShiftMap: Map<string, ShiftType>;
  friendName: string;
}

export function OverlapCalendar({ myShiftMap, friendShiftMap, friendName }: OverlapCalendarProps) {
  const shortName = friendName.split(' ')[0];
  const friendLabel = shortName.length > 5 ? shortName.slice(0, 5) : shortName;

  return (
    <CalendarShell
      renderWeek={(weekDays) => (
        <div className="mb-1.5">
          <DateRow weekDays={weekDays} />
          <ShiftRow
            label="You"
            weekDays={weekDays}
            getShift={(dateStr) => myShiftMap.get(dateStr)}
          />
          <ShiftRow
            label={friendLabel}
            weekDays={weekDays}
            getShift={(dateStr) => friendShiftMap.get(dateStr)}
          />
        </div>
      )}
    />
  );
}
