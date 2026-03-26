// Horizontal bar chart: rating distribution (all-time)
import type { RatingDistribution } from '../../hooks/useProfileStats';
import type { CallRatingValue } from '../../types/database';
import { RATING_LABEL } from '../../types/database';
import { RatingIcon } from '../RatingIcon';

interface RatingBreakdownProps {
  distribution: RatingDistribution;
}

const RATINGS: CallRatingValue[] = ['great', 'good', 'okay', 'rough'];

const BAR_COLORS: Record<CallRatingValue, string> = {
  rough: 'bg-gray-800',
  okay: 'bg-gray-500',
  good: 'bg-gray-300',
  great: 'bg-white border border-gray-300',
};

export function RatingBreakdown({ distribution }: RatingBreakdownProps) {
  const total = distribution.rough + distribution.okay + distribution.good + distribution.great;

  if (total === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-sm text-gray-500">No rated calls yet</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-xs font-medium text-gray-500 mb-3">Rating Breakdown</h4>
      <div className="space-y-2.5">
        {RATINGS.map((rating) => {
          const count = distribution[rating];
          const percent = total > 0 ? (count / total) * 100 : 0;

          return (
            <div key={rating} className="flex items-center gap-2">
              <RatingIcon rating={rating} size="sm" />
              <span className="text-xs text-gray-600 w-12">{RATING_LABEL[rating]}</span>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${BAR_COLORS[rating]} transition-all duration-500`}
                  style={{ width: `${Math.max(percent, count > 0 ? 4 : 0)}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-6 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
