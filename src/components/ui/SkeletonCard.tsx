// Pre-built skeleton shapes for common card types in WhiteCall
import { Skeleton } from './Skeleton';

// Matches StatCard: a number on top and a label below, small square card
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-soft p-3 flex flex-col items-center gap-2">
      <Skeleton className="h-6 w-10" variant="text" />
      <Skeleton className="h-3 w-14" variant="text" />
    </div>
  );
}

// Matches the compact friend row in HomePage's "Friends on call" section:
// avatar circle + name text + heart button placeholder
export function FriendCardSkeleton() {
  return (
    <div className="flex items-center justify-between py-2 px-2 gap-2 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 flex-1">
        <Skeleton variant="circle" className="w-8 h-8 flex-shrink-0" />
        <Skeleton className="h-3.5 w-28" variant="text" />
      </div>
      <Skeleton variant="circle" className="w-8 h-8 flex-shrink-0" />
    </div>
  );
}

// Matches a CallHistoryList row: date + subtitle text on the left, emoji on the right
export function CallHistorySkeleton() {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-36" variant="text" />
        <Skeleton className="h-3 w-24" variant="text" />
      </div>
      <Skeleton variant="circle" className="w-8 h-8 flex-shrink-0" />
    </div>
  );
}
