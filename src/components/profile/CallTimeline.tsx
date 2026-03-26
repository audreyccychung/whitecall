// CallTimeline — compact horizontal bead-on-a-string view of on-duty calls
// Shows last 3 months, one circle per call, colored by rating.
// Auto-scrolls to the most recent (rightmost) call on mount.
import { useRef, useEffect } from 'react';
import { format, subMonths, startOfDay, parseISO, startOfMonth } from 'date-fns';
import type { Call, CallRating } from '../../types/database';
import { RATING_COLORS } from '../../types/database';
import { isOnDutyShift } from '../../constants/shiftTypes';

interface CallTimelineProps {
  calls: Call[];
  ratingsMap: Map<string, CallRating>;
}

// Colors matching the grayscale rating scheme from RatingIcon and share cards
const UNRATED_COLOR = '#e5e7eb'; // gray-200 — neutral, clearly distinct from rated

function getBeadStyle(rating: CallRating | undefined): { background: string; border: string } {
  if (!rating) {
    return { background: UNRATED_COLOR, border: '1.5px solid #d1d5db' };
  }
  const color = RATING_COLORS[rating.rating];
  // White (great) needs a visible border so it doesn't disappear on white background
  const border = rating.rating === 'great' ? '1.5px solid #9ca3af' : '1.5px solid transparent';
  return { background: color, border };
}

interface TimelineEntry {
  call: Call;
  rating: CallRating | undefined;
  dateLabel: string; // e.g. "Mar 5"
  monthKey: string;  // e.g. "2026-03" — used to know when month changes
  isFirstOfMonth: boolean;
  monthLabel: string; // e.g. "Mar"
}

export function CallTimeline({ calls, ratingsMap }: CallTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter: on-duty shifts only, last 3 months, sorted oldest → newest
  const threeMonthsAgo = startOfDay(subMonths(new Date(), 3));

  const filteredCalls = calls
    .filter((call) => {
      if (!isOnDutyShift(call.shift_type)) return false;
      const callDate = parseISO(call.call_date);
      return callDate >= threeMonthsAgo;
    })
    .sort((a, b) => a.call_date.localeCompare(b.call_date));

  // Build timeline entries, detecting month boundaries for labels
  const entries: TimelineEntry[] = filteredCalls.map((call, index) => {
    const date = parseISO(call.call_date);
    const monthKey = format(startOfMonth(date), 'yyyy-MM');
    const prevMonthKey =
      index > 0 ? format(startOfMonth(parseISO(filteredCalls[index - 1].call_date)), 'yyyy-MM') : null;
    const isFirstOfMonth = monthKey !== prevMonthKey;

    return {
      call,
      rating: ratingsMap.get(call.call_date),
      dateLabel: format(date, 'MMM d'),
      monthKey,
      isFirstOfMonth,
      monthLabel: format(date, 'MMM'),
    };
  });

  // Auto-scroll to the rightmost (most recent) end on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-soft-lg p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Call History</h3>
        <p className="text-sm text-gray-400 text-center py-4">No calls in the last 3 months</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft-lg p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-4">Call History</h3>

      {/*
        Scrollable container. `scrollbar-hide` is a Tailwind plugin class;
        we also add the CSS directly via style for browsers that don't have the plugin.
      */}
      <div
        ref={scrollRef}
        className="overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Inner row: wide enough to hold all beads without wrapping */}
        <div className="flex items-end gap-0 min-w-max">
          {entries.map((entry, index) => (
            <BeadColumn key={entry.call.id} entry={entry} isLast={index === entries.length - 1} />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        {(['rough', 'okay', 'good', 'great'] as const).map((r) => (
          <div key={r} className="flex items-center gap-1">
            <div
              className="rounded-full flex-shrink-0"
              style={{
                width: 8,
                height: 8,
                background: RATING_COLORS[r],
                border: r === 'great' ? '1px solid #9ca3af' : '1px solid transparent',
              }}
            />
            <span className="text-xs text-gray-400 capitalize">{r}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <div
            className="rounded-full flex-shrink-0"
            style={{ width: 8, height: 8, background: UNRATED_COLOR, border: '1px solid #d1d5db' }}
          />
          <span className="text-xs text-gray-400">unrated</span>
        </div>
      </div>
    </div>
  );
}

// Single column: optional month label on top, bead in middle, date label below
function BeadColumn({ entry, isLast }: { entry: TimelineEntry; isLast: boolean }) {
  const beadStyle = getBeadStyle(entry.rating);

  return (
    // Each column is 36px wide — enough for the 12px bead + its date label below
    <div className="flex flex-col items-center" style={{ width: 36 }}>
      {/* Month label row — always takes up space to keep alignment consistent */}
      <div className="h-5 flex items-center">
        {entry.isFirstOfMonth && (
          <span className="text-xs font-medium text-gray-400 whitespace-nowrap">
            {entry.monthLabel}
          </span>
        )}
      </div>

      {/* The horizontal line + bead: we use a relative container so the line sits
          at the vertical center of the bead regardless of label height */}
      <div className="flex items-center w-full" style={{ height: 20 }}>
        {/* Left half-line */}
        <div className="flex-1 h-px bg-gray-200" />

        {/* Bead */}
        <div
          className="rounded-full flex-shrink-0"
          style={{
            width: 12,
            height: 12,
            background: beadStyle.background,
            border: beadStyle.border,
            boxSizing: 'border-box',
          }}
        />

        {/* Right half-line — omitted on the last bead so the line doesn't extend past */}
        {isLast ? (
          <div className="flex-1" />
        ) : (
          <div className="flex-1 h-px bg-gray-200" />
        )}
      </div>

      {/* Date label */}
      <div className="mt-1 text-center">
        <span
          className="text-gray-400 whitespace-nowrap"
          style={{ fontSize: 9, lineHeight: '12px' }}
        >
          {entry.dateLabel}
        </span>
      </div>
    </div>
  );
}
