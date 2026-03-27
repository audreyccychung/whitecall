// Group overlap calendar: N rows per week (one per member), month view
import type { ShiftType } from '../types/database';
import { CalendarShell, DateRow, ShiftRow } from './CalendarShell';

interface GroupMemberInfo {
  userId: string;
  name: string;
}

interface GroupOverlapCalendarProps {
  myUserId: string;
  members: GroupMemberInfo[];
  callsMap: Map<string, Map<string, ShiftType>>;
}

export function GroupOverlapCalendar({ myUserId, members, callsMap }: GroupOverlapCalendarProps) {
  // Sort: current user first, then alphabetical
  const sortedMembers = [...members].sort((a, b) => {
    if (a.userId === myUserId) return -1;
    if (b.userId === myUserId) return 1;
    return a.name.localeCompare(b.name);
  });

  const getLabel = (m: GroupMemberInfo) => {
    if (m.userId === myUserId) return 'You';
    const first = m.name.split(' ')[0];
    return first.length > 5 ? first.slice(0, 5) : first;
  };

  return (
    <CalendarShell
      renderWeek={(weekDays) => (
        <div className="mb-2">
          <DateRow weekDays={weekDays} />
          {sortedMembers.map((member) => (
            <ShiftRow
              key={member.userId}
              label={getLabel(member)}
              weekDays={weekDays}
              getShift={(dateStr) => callsMap.get(dateStr)?.get(member.userId) as ShiftType | undefined}
              cellHeight={16}
            />
          ))}
        </div>
      )}
    />
  );
}
