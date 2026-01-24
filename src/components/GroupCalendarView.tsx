// Group calendar view - 14-day horizontal grid showing who's on call
import { useState } from 'react';
import { useGroupCalls } from '../hooks/useGroupCalls';
import { AvatarDisplay } from './AvatarDisplay';
import { DayDetailModal } from './DayDetailModal';
import type { GroupCalendarDay, GroupMemberOnCall } from '../types/group';

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
  const membersOnCall = day.membersOnCall;
  const displayMembers = membersOnCall.slice(0, 3); // Show max 3 avatars
  const extraCount = membersOnCall.length - 3;

  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 w-14 flex flex-col items-center py-2 rounded-lg transition-colors
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

      {/* Status indicator - avatars or free */}
      <div className="mt-1 min-h-[28px] flex flex-col items-center justify-center gap-0.5">
        {day.isFree ? (
          <span className="text-green-500 text-xs">Free</span>
        ) : (
          <>
            {/* Stack avatars vertically */}
            <div className="flex flex-col items-center gap-0.5">
              {displayMembers.map((member) => (
                <AvatarDisplay
                  key={member.user_id}
                  avatarType={member.avatar_type}
                  avatarColor={member.avatar_color}
                  size="tiny"
                />
              ))}
            </div>
            {/* Show +N if more than 3 */}
            {extraCount > 0 && (
              <span className="text-xs text-gray-500">+{extraCount}</span>
            )}
          </>
        )}
      </div>
    </button>
  );
}

interface GroupCalendarViewProps {
  groupId: string;
  onMemberClick?: (member: GroupMemberOnCall) => void;
}

// Format date for banner display (e.g., "Mon, Jan 20")
function formatBannerDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function GroupCalendarView({ groupId, onMemberClick }: GroupCalendarViewProps) {
  const { calendarDays, nextFreeDay, loading, error } = useGroupCalls(groupId);
  const [selectedDay, setSelectedDay] = useState<GroupCalendarDay | null>(null);

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
    setSelectedDay(day);
  };

  const handleMemberClick = (member: GroupMemberOnCall) => {
    setSelectedDay(null); // Close day modal first
    onMemberClick?.(member);
  };

  // Check if today is free
  const todayStr = (() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  })();
  const todayIsFree = nextFreeDay === todayStr;
  const allDaysFree = calendarDays.every((day) => day.isFree);

  return (
    <div className="space-y-3">
      {/* Next free day banner */}
      {allDaysFree ? (
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl px-4 py-3 text-center">
          <span className="text-xl">🎉</span>
          <p className="font-semibold text-green-700">All days are free!</p>
        </div>
      ) : todayIsFree ? (
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl px-4 py-3 text-center">
          <span className="text-xl">🎉</span>
          <p className="font-semibold text-green-700">Quiet day! No one's on call</p>
        </div>
      ) : nextFreeDay ? (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-green-700 text-sm font-medium">
          Next free day: {formatBannerDate(nextFreeDay)}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-600 text-sm font-medium">
          No free days in the next 2 weeks
        </div>
      )}

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

      {/* Day detail modal */}
      <DayDetailModal
        day={selectedDay}
        onClose={() => setSelectedDay(null)}
        onMemberClick={handleMemberClick}
      />
    </div>
  );
}
