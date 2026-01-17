// Group calendar view - 14-day horizontal grid showing who's on call
import { useGroupCalls } from '../hooks/useGroupCalls';
import type { GroupCalendarDay } from '../types/group';

// Format date for display (e.g., "Fri 17")
function formatDayHeader(dateStr: string): { dayName: string; dayNum: string } {
  const date = new Date(dateStr + 'T00:00:00');
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNum = date.getDate().toString();
  return { dayName, dayNum };
}

// Check if date is today
function isToday(dateStr: string): boolean {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return dateStr === todayStr;
}

interface CalendarDayCellProps {
  day: GroupCalendarDay;
  onClick: () => void;
}

function CalendarDayCell({ day, onClick }: CalendarDayCellProps) {
  const { dayName, dayNum } = formatDayHeader(day.date);
  const today = isToday(day.date);
  const memberCount = day.membersOnCall.length;

  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 w-12 flex flex-col items-center py-2 rounded-lg transition-colors
        ${today ? 'ring-2 ring-sky-soft-500' : ''}
        ${day.isFree ? 'bg-green-50 hover:bg-green-100' : 'bg-gray-50 hover:bg-gray-100'}
      `}
    >
      {/* Day name */}
      <span className={`text-xs font-medium ${today ? 'text-sky-soft-600' : 'text-gray-500'}`}>
        {dayName}
      </span>

      {/* Day number */}
      <span className={`text-sm font-bold ${today ? 'text-sky-soft-700' : 'text-gray-800'}`}>
        {dayNum}
      </span>

      {/* Status indicator */}
      <div className="mt-1 h-5 flex items-center justify-center">
        {day.isFree ? (
          <span className="text-green-500 text-xs">Free</span>
        ) : (
          <span className="text-xs text-gray-600 font-medium">{memberCount}</span>
        )}
      </div>
    </button>
  );
}

interface GroupCalendarViewProps {
  groupId: string;
}

export function GroupCalendarView({ groupId }: GroupCalendarViewProps) {
  const { calendarDays, loading, error } = useGroupCalls(groupId);

  if (loading) {
    return (
      <div className="text-center py-6">
        <div className="w-8 h-8 border-3 border-sky-soft-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-gray-500">Loading schedule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (calendarDays.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-gray-500">No schedule data available.</p>
      </div>
    );
  }

  const handleDayClick = (day: GroupCalendarDay) => {
    // TODO: Step 8 - Open day detail modal
    console.log('Day clicked:', day.date, day.membersOnCall);
  };

  return (
    <div className="space-y-3">
      {/* Calendar grid - horizontal scroll */}
      <div
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {calendarDays.map((day) => (
          <CalendarDayCell
            key={day.date}
            day={day}
            onClick={() => handleDayClick(day)}
          />
        ))}
      </div>

      {/* Scroll hint for mobile */}
      <p className="text-xs text-gray-400 text-center">
        Scroll to see more days
      </p>
    </div>
  );
}
